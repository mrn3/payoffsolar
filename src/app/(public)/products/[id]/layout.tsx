import { Metadata } from 'next';
import { ProductModel, ProductImageModel, ProductCategoryModel } from '@/lib/models';

interface ProductWithDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category_id?: string;
  category_name?: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
  is_active: boolean;
}

// Server-side function to fetch product data for metadata by ID
async function getProductById(id: string): Promise<ProductWithDetails | null> {
  try {
    const product = await ProductModel.getById(id);
    if (!product || !product.is_active) {
      return null;
    }

    const images = await ProductImageModel.getByProductId(product.id);

    let categoryName: string | null = null;
    if (product.category_id) {
      const category = await ProductCategoryModel.getById(product.category_id);
      categoryName = category?.name ?? null;
    }

    return {
      ...product,
      category_name: categoryName || undefined,
      images,
    };
  } catch (error) {
    console.error('Error fetching product by id for metadata:', error);
    return null;
  }
}

// Generate metadata for SEO for /products/[id] route
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found - Payoff Solar',
      description: 'The product you are looking for could not be found.',
    };
  }

  const title = `${product.name} - ${product.sku} | Payoff Solar`;

  const description = product.description
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : `Shop ${product.name} (${product.sku}) at Payoff Solar. High-quality solar equipment with professional installation and support.`;

  const imageUrl = product.images && product.images.length > 0
    ? product.images[0].image_url
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

