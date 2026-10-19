import { cache } from 'react';
import {
  ProductModel, ProductCategoryModel, ProductImageModel,
  InventoryModel, ProductBundleItemModel,
} from '@/lib/models';
import type { Product, ProductImage, ProductBundleItemWithProduct } from '@/lib/types';

export interface ProductDetails extends Product {
  category_name?: string;
  images: ProductImage[];
  quantity_available: number;
  bundle_items?: ProductBundleItemWithProduct[];
}

export const getCategories = cache(() => ProductCategoryModel.getAll());

export const getProduct = cache(async (value: string, by: 'slug' | 'id' = 'slug'): Promise<ProductDetails | null> => {
  const product = await (by === 'slug' ? ProductModel.getBySlug(value) : ProductModel.getById(value));
  if (!product || !product.is_active) return null;

  const [images, quantity, category, bundleItems] = await Promise.all([
    ProductImageModel.getByProductId(product.id),
    InventoryModel.getTotalQuantityByProductId(product.id),
    product.category_id ? ProductCategoryModel.getById(product.category_id) : null,
    product.is_bundle ? ProductBundleItemModel.getByBundleId(product.id) : undefined,
  ]);
  return {
    ...product,
    images,
    category_name: category?.name,
    quantity_available: quantity,
    bundle_items: bundleItems,
  };
});

// Where to send visitors of a product that exists but is inactive; null when it never existed or is active
export async function getInactiveProductRedirect(value: string, by: 'slug' | 'id' = 'slug'): Promise<string | null> {
  const product = await (by === 'slug' ? ProductModel.getBySlugIncludingInactive(value) : ProductModel.getById(value));
  if (!product || product.is_active) return null;
  const category = product.category_id ? await ProductCategoryModel.getById(product.category_id) : null;
  return category?.slug ? `/products/category/${encodeURIComponent(category.slug)}` : '/products';
}

export interface CatalogFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
}

export async function getCatalog({ page = 1, limit = 12, search = '', category = '', sort = '' }: CatalogFilters = {}) {
  const offset = (page - 1) * limit;
  let products;
  let total;
  if (search && category) {
    [products, total] = await Promise.all([
      ProductModel.searchByCategory(search, category, limit, offset, sort),
      ProductModel.getSearchByCategoryCount(search, category),
    ]);
  } else if (search) {
    [products, total] = await Promise.all([
      ProductModel.search(search, limit, offset, sort), ProductModel.getSearchCount(search),
    ]);
  } else if (category) {
    [products, total] = await Promise.all([
      ProductModel.getByCategory(category, limit, offset, sort), ProductModel.getCategoryCount(category),
    ]);
  } else {
    [products, total] = await Promise.all([
      ProductModel.getAll(limit, offset, sort), ProductModel.getCount(),
    ]);
  }
  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export type CatalogResult = Awaited<ReturnType<typeof getCatalog>>;

export function catalogFilters(params: Record<string, string | string[] | undefined>): Required<CatalogFilters> {
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  const page = Number(value('page') || 1);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: 12,
    search: value('search'),
    category: value('category'),
    sort: value('sort'),
  };
}
