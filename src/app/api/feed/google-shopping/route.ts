import { NextResponse } from 'next/server';
import { ProductModel, InventoryModel } from '@/lib/models';

// Google product category for solar panels
const GOOGLE_PRODUCT_CATEGORY = 'Hardware > Electrical > Solar Energy';
const BRAND = 'Payoff Solar';
const CONDITION = 'new';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://payoffsolar.com';

    // Fetch all active products (up to 1000 — well within Merchant Center limits)
    const products = await ProductModel.getAll(1000, 0);

    const items = await Promise.all(
      products.map(async (product) => {
        const totalInventory = await InventoryModel.getTotalQuantityByProductId(product.id);
        const availability = totalInventory > 0 ? 'in stock' : 'out of stock';

        const productUrl = product.slug
          ? `${siteUrl}/product/${product.slug}`
          : `${siteUrl}/products/${product.id}`;

        const imageUrl = product.first_image_url
          ? product.first_image_url.startsWith('http')
            ? product.first_image_url
            : `${siteUrl}${product.first_image_url}`
          : '';

        const price = Number(product.price).toFixed(2);
        const description = product.description
          ? escapeXml(product.description.replace(/<[^>]*>/g, '').trim())
          : escapeXml(product.name);

        return `    <item>
      <g:id>${escapeXml(product.sku || product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      ${imageUrl ? `<g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ''}
      <g:price>${price} USD</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>${CONDITION}</g:condition>
      <g:brand>${BRAND}</g:brand>
      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>
      ${product.sku ? `<g:mpn>${escapeXml(product.sku)}</g:mpn>` : ''}
      ${product.category_name ? `<g:product_type>${escapeXml(product.category_name)}</g:product_type>` : ''}
    </item>`;
      })
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Payoff Solar</title>
    <link>${siteUrl}</link>
    <description>Wholesale solar panels — containers and truckloads direct to you</description>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating Google Shopping feed:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}
