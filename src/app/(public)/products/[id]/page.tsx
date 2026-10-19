import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetail from '@/components/products/ProductDetail';
import { getCategories, getProduct } from '@/lib/catalog';
import { jsonLd, productMetadata, productPath, productStructuredData } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveProduct(id: string) {
  const product = await getProduct(id, 'id');
  if (product) return product;
  const category = (await getCategories()).find(category => category.slug === id);
  if (category) return category;
  notFound();
}

export async function generateMetadata({ params }: Props) {
  const result = await resolveProduct((await params).id);
  if (!('price' in result)) return {};
  return productMetadata(result);
}

export default async function LegacyProductPage({ params, searchParams }: Props) {
  const result = await resolveProduct((await params).id);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach(item => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = query.size ? `?${query}` : '';
  if (!('price' in result)) permanentRedirect(`/products/category/${encodeURIComponent(result.slug)}${suffix}`);
  if (result.slug) permanentRedirect(`${productPath(result)}${suffix}`);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productStructuredData(result)) }} />
      <ProductDetail product={result} />
    </>
  );
}
