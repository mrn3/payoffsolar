import { notFound, redirect } from 'next/navigation';
import ProductDetail from '@/components/products/ProductDetail';
import { getInactiveProductRedirect, getProduct } from '@/lib/catalog';
import { jsonLd, productMetadata, productStructuredData } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

async function requireProduct(slug: string) {
  const product = await getProduct(slug);
  if (product) return product;
  const target = await getInactiveProductRedirect(slug);
  if (target) redirect(target);
  notFound();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await requireProduct(slug);
  return productMetadata(product);
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await requireProduct(slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productStructuredData(product)) }} />
      <ProductDetail product={product} />
    </>
  );
}
