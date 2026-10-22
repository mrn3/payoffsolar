// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getSession, type AuthSession } from '@/lib/auth';
import { executeQuery, executeSingle, getOne, withTransaction } from '@/lib/mysql/connection';
import { OrderModel, SiteSettingsModel, UserModel, type SiteSetting } from '@/lib/models';
import { GET as getUsers } from '../users/route';
import { GET as getOrders } from '../orders/route';
import { GET as getSettings } from '../settings/route';
import { GET as getSetting } from '../settings/[key]/route';

vi.mock('@/lib/mysql/connection', () => ({
  executeQuery: vi.fn(),
  executeSingle: vi.fn(),
  getOne: vi.fn(),
  withTransaction: vi.fn(),
}));
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/auth')>(),
  getSession: vi.fn(),
}));

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string; key: string }> }
) => Promise<Response>;
type ApiModule = Partial<Record<Method, RouteHandler>>;

const routes = import.meta.glob<ApiModule>([
  '../users/**/route.ts',
  '../orders/**/route.ts',
  '../content/**/route.ts',
  '../settings/**/route.ts',
  '!../orders/public/route.ts',
  '!../orders/[[]id]/invoice/route.ts',
  '!../orders/[[]id]/invoice/pdf/route.ts',
]);
const methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const contactRoutes = new Set([
  '../orders/[id]/receipt/route.ts',
  '../orders/[id]/receipt/pdf/route.ts',
  '../orders/[id]/send-invoice-email/route.ts',
  '../orders/[id]/send-invoice-sms/route.ts',
  '../orders/[id]/send-receipt-email/route.ts',
  '../orders/[id]/send-receipt-sms/route.ts',
]);
const session: AuthSession = {
  user: { id: 'user-1', email: 'admin@example.test', email_verified: true, created_at: '' },
  profile: {
    id: 'user-1', email: 'admin@example.test', first_name: 'Admin', last_name: 'User',
    phone: null, avatar_url: null, role: 'admin',
  },
};
const publicSetting: SiteSetting = {
  id: 'setting-1', setting_key: 'business_phone', setting_value: '555-0100',
  setting_type: 'string', description: null, is_public: true, created_at: '', updated_at: '',
};

function context() {
  return { params: Promise.resolve({ id: 'order-1', key: 'private_key' }) };
}

function expectNoDatabaseWork() {
  for (const query of [executeQuery, executeSingle, getOne, withTransaction]) {
    expect(query).not.toHaveBeenCalled();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('protected API authentication', () => {
  it('covers every scoped route except the three intentional public order routes', () => {
    expect(Object.keys(routes)).toHaveLength(36);
    expect(Object.keys(routes)).not.toContain('../orders/[id]/invoice/route.ts');
    expect(Object.keys(routes)).not.toContain('../orders/[id]/invoice/pdf/route.ts');
  });

  it.each(Object.entries(routes))('%s rejects unauthenticated requests before database work', async (path, load) => {
    const route = await load();
    const log = vi.spyOn(console, 'error');
    let checked = 0;
    for (const method of methods) {
      const handler = route[method];
      if (!handler) continue;
      const response = await handler(new NextRequest(`http://localhost/api/test`, { method }), context());
      expect(response.status, `${path} ${method}`).toBe(401);
      expect(await response.json()).toMatchObject(
        path.startsWith('../content/') ? { _error: 'Unauthorized' } : { error: expect.any(String) }
      );
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
    expectNoDatabaseWork();
    expect(log).not.toHaveBeenCalled();
  });

  it.each(Object.entries(routes).filter(([path]) => !contactRoutes.has(path)))(
    '%s rejects non-admin access before business queries',
    async (path, load) => {
      vi.mocked(getSession).mockResolvedValue({
        ...session, profile: { ...session.profile, role: 'contact' },
      });
      const route = await load();
      for (const method of methods) {
        const handler = route[method];
        if (!handler || (path === '../orders/route.ts' && method === 'GET')) continue;
        const response = await handler(new NextRequest('http://localhost/api/test', { method }), context());
        expect(response.status, `${path} ${method}`).toBe(403);
      }
      expectNoDatabaseWork();
    }
  );

  it('continues to allow administrators to list users', async () => {
    vi.mocked(getSession).mockResolvedValue(session);
    const getAll = vi.spyOn(UserModel, 'getAll').mockResolvedValue([]);

    const response = await getUsers(new NextRequest('http://localhost/api/users'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ users: [] });
    expect(getAll).toHaveBeenCalledOnce();
  });

  it('continues to scope contact order history to the signed-in user', async () => {
    vi.mocked(getSession).mockResolvedValue({
      ...session, profile: { ...session.profile, role: 'contact' },
    });
    const getOwn = vi.spyOn(OrderModel, 'getAllByUser').mockResolvedValue([]);
    vi.spyOn(OrderModel, 'getCountByUser').mockResolvedValue(0);
    const getAll = vi.spyOn(OrderModel, 'getAll');

    const response = await getOrders(new NextRequest('http://localhost/api/orders'));

    expect(response.status).toBe(200);
    expect(getOwn).toHaveBeenCalledWith('user-1', 50, 0, 'order_date', 'desc');
    expect(getAll).not.toHaveBeenCalled();
  });
});

describe('public settings compatibility', () => {
  it('keeps the explicitly public settings list accessible without a session', async () => {
    const getPublic = vi.spyOn(SiteSettingsModel, 'getPublic').mockResolvedValue([publicSetting]);
    const getAll = vi.spyOn(SiteSettingsModel, 'getAll');

    const response = await getSettings(new NextRequest('http://localhost/api/settings?public=true'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ settings: [publicSetting] });
    expect(getPublic).toHaveBeenCalledOnce();
    expect(getAll).not.toHaveBeenCalled();
  });

  it('allows explicit single-key public lookups without querying private settings', async () => {
    vi.spyOn(SiteSettingsModel, 'getPublic').mockResolvedValue([publicSetting]);
    const getByKey = vi.spyOn(SiteSettingsModel, 'getByKey');

    const response = await getSetting(
      new NextRequest('http://localhost/api/settings/business_phone?public=true'),
      { params: Promise.resolve({ key: 'business_phone' }) }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ setting: publicSetting });
    expect(getByKey).not.toHaveBeenCalled();
  });

  it('does not disclose private keys through the public lookup', async () => {
    vi.spyOn(SiteSettingsModel, 'getPublic').mockResolvedValue([publicSetting]);
    const getByKey = vi.spyOn(SiteSettingsModel, 'getByKey');

    const response = await getSetting(
      new NextRequest('http://localhost/api/settings/private_key?public=true'),
      context()
    );

    expect(response.status).toBe(404);
    expect(getByKey).not.toHaveBeenCalled();
  });
});
