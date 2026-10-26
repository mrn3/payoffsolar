import type { MetadataRoute } from 'next';
import { ContentModel, ProductModel, ProductCategoryModel } from '@/lib/models';
import { corePages, productPath, SITE_URL } from '@/lib/seo';
import { retiredContentRedirects } from '@/lib/content-redirects';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = corePages.map(page => ({ url: `${SITE_URL}${page.path}` }));
  const categories = await ProductCategoryModel.getAll();
  entries.push(...categories.map(category => ({
    url: `${SITE_URL}/products/category/${encodeURIComponent(category.slug)}`,
    lastModified: category.updated_at,
  })));

  const batchSize = 1000;
  for (let offset = 0; ; offset += batchSize) {
    const products = await ProductModel.getAll(batchSize, offset);
    entries.push(...products.map(product => ({
      url: `${SITE_URL}${productPath(product)}`,
      lastModified: product.updated_at,
    })));
    if (products.length < batchSize) break;
  }

  const reserved = new Set([
    ...corePages.map(page => page.path.slice(1)),
    'api', 'dashboard', 'products', 'product', 'uploads', 'cart', 'checkout',
    'login', 'register', 'forgot-password', 'reset-password', 'demo-blocks',
  ]);
  for (let offset = 0; ; offset += batchSize) {
    const content = await ContentModel.getPublished(batchSize, offset);
    entries.push(...content.filter(page =>
      !reserved.has(page.slug.split('/')[0]) && !Object.hasOwn(retiredContentRedirects, page.slug)
    ).map(page => ({
      url: `${SITE_URL}/${encodeURIComponent(page.slug)}`,
      lastModified: page.updated_at,
    })));
    if (content.length < batchSize) break;
  }
  return entries;
}
