import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ProductModel, ProductCategoryModel, ProductImageModel,
  InventoryModel, ProductBundleItemModel, ContentModel,
} from '@/lib/models';
import { catalogFilters, getCatalog, getProduct, type ProductDetails } from '@/lib/catalog';
import { corePageMetadata, jsonLd, productMetadata, productStructuredData, SITE_URL } from '@/lib/seo';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import ProductPage from '@/app/(public)/product/[slug]/page';
import LegacyProductPage from '@/app/(public)/products/[id]/page';
import CategoryPage from '@/app/(public)/products/category/[slug]/page';
import ProductCatalog from '@/components/products/ProductCatalog';
import ProductDetail from '@/components/products/ProductDetail';

vi.mock('@/lib/models', () => ({
  ProductModel: {
    getBySlug: vi.fn(), getById: vi.fn(), getAll: vi.fn(), getCount: vi.fn(),
    search: vi.fn(), getSearchCount: vi.fn(),
    getByCategory: vi.fn(), getCategoryCount: vi.fn(),
    searchByCategory: vi.fn(), getSearchByCategoryCount: vi.fn(),
  },
  ProductCategoryModel: { getAll: vi.fn(), getById: vi.fn() },
  ProductImageModel: { getByProductId: vi.fn() },
  InventoryModel: { getTotalQuantityByProductId: vi.fn() },
  ProductBundleItemModel: { getByBundleId: vi.fn() },
  ContentModel: { getPublished: vi.fn() },
}));

const cart = vi.hoisted(() => ({
  addItem: vi.fn(), applyAffiliateCode: vi.fn(),
  getDiscountedPrice: (price: number) => price,
  state: { affiliateCode: null },
}));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => cart }));
vi.mock('@/components/GoogleAnalytics', () => ({
  formatGAItem: vi.fn(() => ({})), trackViewItem: vi.fn(),
}));
vi.mock('@/components/products/RelatedProducts', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
  permanentRedirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); },
}));

const product: ProductDetails = {
  id: 'product-1', slug: 'solar-panel', name: 'Solar Panel', sku: 'SP-100',
  description: '<p>Efficient &amp; affordable solar.</p>', price: 120,
  tax_percentage: 0, is_bundle: false, bundle_pricing_type: 'fixed',
  bundle_discount_percentage: 0, is_active: true,
  created_at: '2026-01-01', updated_at: '2026-10-18',
  images: [], quantity_available: 3,
};
const category = {
  id: 'category-1', name: 'Solar Panels', slug: 'solar-panels',
  created_at: '2026-01-01', updated_at: '2026-10-18',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ProductModel.getBySlug).mockResolvedValue(product);
  vi.mocked(ProductModel.getById).mockResolvedValue(product);
  vi.mocked(ProductModel.getAll).mockResolvedValue([product]);
  vi.mocked(ProductModel.getCount).mockResolvedValue(25);
  vi.mocked(ProductCategoryModel.getAll).mockResolvedValue([category]);
  vi.mocked(ProductImageModel.getByProductId).mockResolvedValue([]);
  vi.mocked(InventoryModel.getTotalQuantityByProductId).mockResolvedValue(3);
  vi.mocked(ContentModel.getPublished).mockResolvedValue([]);
});

describe('public catalog data', () => {
  it('loads active product details and bundle contents without an HTTP self-fetch', async () => {
    vi.mocked(ProductModel.getBySlug).mockResolvedValue({ ...product, is_bundle: true, category_id: category.id });
    vi.mocked(ProductCategoryModel.getById).mockResolvedValue(category);
    vi.mocked(ProductBundleItemModel.getByBundleId).mockResolvedValue([]);
    expect(await getProduct(product.slug!)).toMatchObject({
      name: product.name, category_name: category.name, quantity_available: 3, bundle_items: [],
    });
    expect(ProductBundleItemModel.getByBundleId).toHaveBeenCalledWith(product.id);
  });

  it.each([null, { ...product, is_active: false }])('excludes missing and inactive products', async value => {
    vi.mocked(ProductModel.getBySlug).mockResolvedValue(value);
    expect(await getProduct('retired-product')).toBeNull();
    expect(ProductImageModel.getByProductId).not.toHaveBeenCalled();
  });

  it('does not turn a database failure into a missing product', async () => {
    vi.mocked(ProductModel.getBySlug).mockRejectedValue(new Error('database unavailable'));
    await expect(getProduct('solar-panel')).rejects.toThrow('database unavailable');
  });

  it('paginates the catalog using the existing model', async () => {
    const result = await getCatalog({ page: 2 });
    expect(ProductModel.getAll).toHaveBeenCalledWith(12, 12, '');
    expect(result.pagination).toEqual({ page: 2, limit: 12, total: 25, totalPages: 3 });
  });

  it.each([
    [{ search: 'panel' }, 'search', 'getSearchCount'],
    [{ category: category.id }, 'getByCategory', 'getCategoryCount'],
    [{ search: 'panel', category: category.id }, 'searchByCategory', 'getSearchByCategoryCount'],
  ] as const)('uses matching filtered query and count for %j', async (filters, list, count) => {
    vi.mocked(ProductModel[list]).mockResolvedValue([product]);
    vi.mocked(ProductModel[count]).mockResolvedValue(1);
    const result = await getCatalog(filters);
    expect(ProductModel[list]).toHaveBeenCalled();
    expect(ProductModel[count]).toHaveBeenCalled();
    expect(result.pagination.total).toBe(1);
  });

  it('handles invalid and repeated page query parameters', () => {
    for (const page of ['0', '-1', 'NaN', '1.5', ['2', '3']]) {
      expect(catalogFilters({ page }).page).toBe(1);
    }
    expect(catalogFilters({ page: '2', category: category.id }).page).toBe(2);
  });
});

describe('SEO output', () => {
  it('has distinct core-page titles and canonical URLs', () => {
    const home = corePageMetadata('/');
    const about = corePageMetadata('/about');
    expect(home.title).not.toEqual(about.title);
    expect(about.alternates?.canonical).toBe(`${SITE_URL}/about`);
  });

  it('uses the product slug canonical and plain-text description', () => {
    const metadata = productMetadata(product);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/product/solar-panel`);
    expect(metadata.description).toBe('Efficient & affordable solar.');
  });

  it('uses an ID canonical when a product has no slug', () => {
    expect(productMetadata({ ...product, slug: undefined }).alternates?.canonical).toBe(`${SITE_URL}/products/product-1`);
  });

  it('publishes accurate price and stock without fabricated reviews', () => {
    const data = productStructuredData(product);
    expect(data.offers).toMatchObject({ price: 120, priceCurrency: 'USD', availability: 'https://schema.org/InStock' });
    expect(productStructuredData({ ...product, quantity_available: 0 }).offers.availability).toBe('https://schema.org/OutOfStock');
    expect(data).not.toHaveProperty('aggregateRating');
  });

  it('escapes script delimiters in JSON-LD', () => {
    const serialized = jsonLd({ name: '</script><script>alert(1)</script>' });
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized).name).toBe('</script><script>alert(1)</script>');
  });

  it('advertises the sitemap and permits public pages', () => {
    expect(robots()).toMatchObject({
      sitemap: `${SITE_URL}/sitemap.xml`,
      rules: { userAgent: '*', allow: '/', disallow: expect.arrayContaining(['/dashboard', '/checkout']) },
    });
  });

  it('includes products beyond the first database batch and published CMS pages', async () => {
    vi.mocked(ProductModel.getAll)
      .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ ...product, id: `p-${i}`, slug: `panel-${i}` })))
      .mockResolvedValueOnce([{ ...product, slug: undefined }]);
    vi.mocked(ContentModel.getPublished).mockResolvedValue([{
      id: 'news-1', title: 'Solar Update', slug: 'solar-update',
      content_mode: 'rich_text', type_id: 'news', published: true,
      created_at: '2026-01-01', updated_at: '2026-10-18',
    }]);
    const urls = (await sitemap()).map(entry => entry.url);
    expect(ProductModel.getAll).toHaveBeenLastCalledWith(1000, 1000);
    expect(urls).toContain(`${SITE_URL}/product/panel-999`);
    expect(urls).toContain(`${SITE_URL}/products/product-1`);
    expect(urls).toContain(`${SITE_URL}/products/category/solar-panels`);
    expect(urls).toContain(`${SITE_URL}/solar-update`);
    expect(urls).not.toContain(`${SITE_URL}/checkout`);
  });

  it('fails rather than publishing a partial sitemap on database errors', async () => {
    vi.mocked(ProductModel.getAll).mockRejectedValue(new Error('database unavailable'));
    await expect(sitemap()).rejects.toThrow('database unavailable');
  });
});

describe('server pages and shopping behavior', () => {
  it('returns the not-found signal for missing slug and ID product pages', async () => {
    vi.mocked(ProductModel.getBySlug).mockResolvedValue(null);
    vi.mocked(ProductModel.getById).mockResolvedValue(null);
    await expect(ProductPage({ params: Promise.resolve({ slug: 'retired' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(LegacyProductPage({
      params: Promise.resolve({ id: 'retired' }), searchParams: Promise.resolve({}),
    })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('permanently redirects ID links to slugs and preserves referral and repeated parameters', async () => {
    await expect(LegacyProductPage({
      params: Promise.resolve({ id: product.id }),
      searchParams: Promise.resolve({ ref: 'CREATOR', tag: ['one', 'two'] }),
    })).rejects.toThrow('NEXT_REDIRECT:/product/solar-panel?ref=CREATOR&tag=one&tag=two');
  });

  it('preserves legacy category shortcuts, including single-word slugs', async () => {
    vi.mocked(ProductModel.getById).mockResolvedValue(null);
    await expect(LegacyProductPage({
      params: Promise.resolve({ id: category.slug }), searchParams: Promise.resolve({ ref: 'CREATOR' }),
    })).rejects.toThrow('NEXT_REDIRECT:/products/category/solar-panels?ref=CREATOR');
  });

  it('returns not-found for an unknown category', async () => {
    await expect(CategoryPage({
      params: Promise.resolve({ slug: 'missing-category' }), searchParams: Promise.resolve({}),
    })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders product links, names, and pagination in HTML without running effects', () => {
    const html = renderToStaticMarkup(<ProductCatalog
      initialCatalog={{ products: [product], pagination: { page: 1, limit: 12, total: 25, totalPages: 3 } }}
      categories={[category]} filters={catalogFilters({})}
    />);
    expect(html).toContain('href="/product/solar-panel"');
    expect(html).toContain('Solar Panel');
    expect(html).toContain('href="/products?page=2"');
    expect(html).not.toContain('animate-pulse');
  });

  it('server-renders product details and retains add-to-cart behavior', () => {
    const html = renderToStaticMarkup(<ProductDetail product={product} />);
    expect(html).toContain('Solar Panel');
    expect(html).toContain('$120.00');
    expect(html).not.toContain('Loading product');
    render(<ProductDetail product={product} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({
      product_id: product.id, product_price: 120, product_tax_percentage: 0,
    }), 1);
  });

  it('keeps an active out-of-stock product page instead of treating it as missing', async () => {
    vi.mocked(InventoryModel.getTotalQuantityByProductId).mockResolvedValue(0);
    expect((await getProduct(product.slug!))?.quantity_available).toBe(0);
    await expect(ProductPage({ params: Promise.resolve({ slug: product.slug! }) })).resolves.toBeDefined();
  });

  it('surfaces interactive catalog failures instead of showing stale products as success', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ProductCatalog
      initialCatalog={{ products: [product], pagination: { page: 1, limit: 12, total: 25, totalPages: 3 } }}
      categories={[category]} filters={catalogFilters({})}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Unable to load products'));
    expect(errorLog).toHaveBeenCalled();
    fetchMock.mockRestore();
    errorLog.mockRestore();
  });
});
