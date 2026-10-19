import { notFound } from 'next/navigation';
import ProductDetail from '@/components/products/ProductDetail';
import { getProduct } from '@/lib/catalog';
import { jsonLd, productMetadata, productStructuredData } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return productMetadata(product);
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productStructuredData(product)) }} />
      <ProductDetail product={product} />
    </>
  );
}
