// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const configPath = require.resolve('../../../next.config.js');

function loadConfig(environment: 'development' | 'production') {
  vi.stubEnv('NODE_ENV', environment);
  delete require.cache[configPath];
  return require(configPath) as typeof import('../../../next.config.js');
}

async function headerRules(environment: 'development' | 'production') {
  const config = loadConfig(environment);
  if (!config.headers) throw new Error('Security headers are not configured');
  return config.headers();
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[configPath];
});

describe('browser security configuration', () => {
  it('disables image optimization and SVG optimization and hides the framework header', () => {
    const config = loadConfig('production');
    expect(config.images?.unoptimized).toBe(true);
    expect(config.images?.dangerouslyAllowSVG).toBe(false);
    expect(config.poweredByHeader).toBe(false);
  });

  it('applies the requested headers to every route without removing existing cache policy', async () => {
    const rules = await headerRules('production');
    const global = rules.find((rule) => rule.source === '/:path*');
    const headers = Object.fromEntries(global!.headers.map(({ key, value }) => [key, value]));

    expect(headers).toMatchObject({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('"https://js.stripe.com"');
    expect(rules.some((rule) => rule.headers.some((header) => header.key === 'Cache-Control'))).toBe(true);
  });

  it('allows existing integrations but excludes eval from production scripts', async () => {
    const rules = await headerRules('production');
    const csp = rules.flatMap((rule) => rule.headers).find((header) => header.key === 'Content-Security-Policy')!.value;
    const directives = Object.fromEntries(csp.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ');
      return [name, sources];
    }));

    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['frame-ancestors']).toEqual(["'self'"]);
    expect(directives['script-src']).toContain('https://www.googletagmanager.com');
    expect(directives['script-src']).toContain('https://maps.googleapis.com');
    expect(directives['script-src']).toContain('https://js.stripe.com');
    expect(directives['script-src']).not.toContain("'unsafe-eval'");
    expect(directives['frame-src']).toContain('https://www.youtube.com');
    expect(directives['frame-src']).toContain('https://player.vimeo.com');
    expect(directives['img-src']).toContain('https:');
    expect(directives['connect-src']).toContain('https://*.google-analytics.com');
    expect(directives).toHaveProperty('upgrade-insecure-requests');
  });

  it('permits development tooling without forcing local HTTP requests to HTTPS', async () => {
    const rules = await headerRules('development');
    const csp = rules.flatMap((rule) => rule.headers).find((header) => header.key === 'Content-Security-Policy')!.value;

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws://localhost:*');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
