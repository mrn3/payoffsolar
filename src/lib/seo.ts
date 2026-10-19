import type { Metadata } from 'next';
import type { Product } from '@/lib/types';
import type { ProductDetails } from '@/lib/catalog';
import { createTextPreview } from '@/lib/utils/text';

export const SITE_URL = 'https://payoffsolar.com';

export function productPath(product: Pick<Product, 'id' | 'slug'>) {
  return product.slug ? `/product/${encodeURIComponent(product.slug)}` : `/products/${encodeURIComponent(product.id)}`;
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = new URL(path, SITE_URL).href;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Payoff Solar', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function productMetadata(product: ProductDetails): Metadata {
  const description = createTextPreview(product.description || `Shop ${product.name} (${product.sku}) at Payoff Solar.`, 157);
  const metadata = pageMetadata(`${product.name} - ${product.sku} | Payoff Solar`, description, productPath(product));
  const images = product.images.map(image => ({ url: new URL(image.image_url, SITE_URL).href, alt: image.alt_text || product.name }));
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images },
    twitter: { ...metadata.twitter, images: images.map(image => image.url) },
  };
}

export function productStructuredData(product: ProductDetails) {
  const url = new URL(productPath(product), SITE_URL).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: createTextPreview(product.description || product.name, 5000),
    sku: product.sku,
    image: product.images.map(image => new URL(image.image_url, SITE_URL).href),
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: Number(product.price),
      availability: product.quantity_available > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Payoff Solar', url: SITE_URL },
    },
  };
}

export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export const corePages = [
  { path: '/', title: 'Payoff Solar - Solar Equipment, DIY Kits & Installation', description: 'Shop affordable solar panels, batteries, inverters, and DIY solar kits. Get expert equipment guidance and solar installation from Payoff Solar.' },
  { path: '/products', title: 'Solar Panels, Batteries & DIY Solar Kits | Payoff Solar', description: 'Browse solar panels, batteries, inverters, mounting systems, and solar kits. Compare equipment and shop solar supplies at Payoff Solar.' },
  { path: '/about', title: 'About Our Solar Team | Payoff Solar', description: 'Meet the Payoff Solar team and learn how we help homeowners and businesses choose affordable solar equipment and installation.' },
  { path: '/contact', title: 'Contact Us for Solar Equipment & Installation | Payoff Solar', description: 'Contact Payoff Solar for solar equipment advice, DIY system support, or an installation quote. Tell us about your solar project.' },
  { path: '/pricing', title: 'Solar Installation Packages & Pricing | Payoff Solar', description: 'Explore Payoff Solar installation packages and find a solar system that fits your home, energy needs, and budget.' },
  { path: '/news', title: 'Solar News & Updates | Payoff Solar', description: 'Read solar news, product updates, and insights from the Payoff Solar team.' },
  { path: '/shipping', title: 'Shipping & Returns | Payoff Solar', description: 'Solar equipment shipping and returns at Payoff Solar. Nationwide LTL freight shipping and local pickup in West Jordan, Utah.' },
  { path: '/privacy', title: 'Privacy Policy | Payoff Solar', description: 'Learn how Payoff Solar collects, uses, and protects your personal information.' },
  { path: '/terms', title: 'Terms of Service | Payoff Solar', description: 'Read the terms and conditions for using Payoff Solar and purchasing solar equipment and services.' },
];

export function corePageMetadata(path: string) {
  const page = corePages.find(page => page.path === path);
  if (!page) throw new Error(`Missing SEO metadata for ${path}`);
  return pageMetadata(page.title, page.description, page.path);
}
