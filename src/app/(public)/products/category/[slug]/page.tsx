import { notFound } from 'next/navigation';
import ProductCatalog from '@/components/products/ProductCatalog';
import { catalogFilters, getCatalog, getCategories } from '@/lib/catalog';
import { pageMetadata } from '@/lib/seo';
import { createTextPreview } from '@/lib/utils/text';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getCategory(slug: string) {
  const categories = await getCategories();
  const category = categories.find(category => category.slug === slug);
  if (!category) notFound();
  return { category, categories };
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category } = await getCategory(slug);
  const { page } = catalogFilters(await searchParams);
  return pageMetadata(
    `Shop ${category.name} Online - Ships Nationwide${page > 1 ? ` - Page ${page}` : ''} | Payoff Solar`,
    createTextPreview(category.description || `Shop ${category.name} at Payoff Solar. Affordable solar equipment for your home or business, shipped to all 50 states with expert support.`, 157),
    `/products/category/${encodeURIComponent(slug)}${page > 1 ? `?page=${page}` : ''}`,
  );
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, categories } = await getCategory(slug);
  const filters = { ...catalogFilters(await searchParams), category: category.id };
  const catalog = await getCatalog(filters);
  if (filters.page > 1 && filters.page > catalog.pagination.totalPages) notFound();
  return <ProductCatalog key={`${slug}:${JSON.stringify(filters)}`} initialCatalog={catalog} categories={categories} filters={filters} category={category} />;
}
