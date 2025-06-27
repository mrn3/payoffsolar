import { Metadata } from 'next';
import { ProductModel, ProductImageModel, ProductCategoryModel } from '@/lib/models';

interface ProductWithDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  slug?: string;
  category_name?: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
}

// Server-side function to fetch product data for metadata
async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  try {
    // Fetch product details by slug
    const product = await ProductModel.getBySlug(slug);
    if (!product || !product.is_active) {
      return null;
    }

    // Fetch product images
    const images = await ProductImageModel.getByProductId(product.id);

    // Fetch category name if product has a category
    let categoryName = null;
    if (product.category_id) {
      const category = await ProductCategoryModel.getById(product.category_id);
      categoryName = category?.name;
    }

    return {
      ...product,
      category_name: categoryName,
      images,
    };
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found - Payoff Solar',
      description: 'The product you are looking for could not be found.',
    };
  }

  // Create SEO-friendly title with product name and SKU
  const title = `${product.name} - ${product.sku} | Payoff Solar`;
  
  // Create description from product description or fallback
  const description = product.description 
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : `Shop ${product.name} (${product.sku}) at Payoff Solar. High-quality solar equipment with professional installation and support.`;

  return {
    title,
    description,
    keywords: `${product.name}, ${product.sku}, solar equipment, solar panels, ${product.category_name || 'solar products'}`,
    openGraph: {
      title,
      description,
      images: product.images && product.images.length > 0 
        ? [{ url: product.images[0].image_url, alt: product.name }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images && product.images.length > 0 
        ? [product.images[0].image_url]
        : [],
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
