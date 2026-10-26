import { notFound } from 'next/navigation';
import ProductCatalog from '@/components/products/ProductCatalog';
import { catalogFilters, getCatalog, getCategories } from '@/lib/catalog';
import { corePages, pageMetadata } from '@/lib/seo';

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = catalogFilters(await searchParams);
  const page = corePages.find(page => page.path === '/products')!;
  return pageMetadata(
    filters.page > 1 ? `Solar Products - Page ${filters.page} | Payoff Solar` : page.title,
    page.description,
    filters.page > 1 ? `/products?page=${filters.page}` : '/products',
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = catalogFilters(await searchParams);
  const [catalog, categories] = await Promise.all([getCatalog(filters), getCategories()]);
  if (filters.page > 1 && filters.page > catalog.pagination.totalPages) notFound();
  return <ProductCatalog key={JSON.stringify(filters)} initialCatalog={catalog} categories={categories} filters={filters} />;
}
