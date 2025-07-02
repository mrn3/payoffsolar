// Base listing service interface and utilities
import { ProductWithImages, ListingPlatform, ListingTemplate, ProductListing, ProductImage } from '@/lib/models';

export interface ListingData {
  title: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  condition?: string;
  quantity?: number;
  productId?: string;
  productUrl?: string;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  shipping?: {
    available: boolean;
    cost?: number;
    methods?: string[];
  };
}

export interface ListingResult {
  success: boolean;
  listingId?: string;
  listingUrl?: string;
  error?: string;
  warnings?: string[];
}

export interface PlatformCredentials {
  [key: string]: any;
}

export abstract class BasePlatformService {
  protected platform: ListingPlatform;
  protected credentials?: PlatformCredentials;

  constructor(platform: ListingPlatform, credentials?: PlatformCredentials) {
    this.platform = platform;
    this.credentials = credentials;
  }

  // Abstract methods that each platform must implement
  abstract authenticate(): Promise<boolean>;
  abstract createListing(data: ListingData): Promise<ListingResult>;
  abstract updateListing(listingId: string, data: Partial<ListingData>): Promise<ListingResult>;
  abstract deleteListing(listingId: string): Promise<ListingResult>;
  abstract getListingStatus(listingId: string): Promise<{ status: string; url?: string }>;

  // Common utility methods
  protected validateCredentials(): boolean {
    if (!this.credentials) {
      return false;
    }
    return this.platform.requires_auth ? this.hasRequiredCredentials() : true;
  }

  protected abstract hasRequiredCredentials(): boolean;

  protected formatPrice(price: number | string, adjustment?: { type: 'percentage' | 'fixed'; value: number }): number {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return 0;
    }

    if (!adjustment || adjustment.type === 'none') {
      return numPrice;
    }

    if (adjustment.type === 'percentage') {
      return numPrice * (1 + adjustment.value / 100);
    } else if (adjustment.type === 'fixed') {
      return numPrice + adjustment.value;
    }

    return numPrice;
  }

  protected processTemplate(template: string, product: ProductWithImages, price?: number): string {
    if (!template) return '';

    // Safely format price values
    const formatPrice = (value: any): string => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
    };

    return template
      .replace(/\{\{product_name\}\}/g, product.name || '')
      .replace(/\{\{product_sku\}\}/g, product.sku || '')
      .replace(/\{\{product_price\}\}/g, price !== undefined ? formatPrice(price) : formatPrice(product.price))
      .replace(/\{\{product_description\}\}/g, this.stripHtml(product.description || ''))
      .replace(/\{\{product_category\}\}/g, product.category_name || '');
  }

  protected stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  protected validateImages(images: ProductImage[]): string[] {
    const maxImages = this.platform.configuration?.max_images || 10;
    const validImages = images
      .filter(img => img.image_url && this.isValidImageUrl(img.image_url))
      .slice(0, maxImages)
      .map(img => this.convertToAbsoluteUrl(img.image_url));

    return validImages;
  }

  protected isValidImageUrl(url: string): boolean {
    if (!url) return false;

    // Check if it's already an absolute URL
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      // If not absolute, check if it's a valid relative path
      return url.startsWith('/') && (
        url.includes('.jpg') ||
        url.includes('.jpeg') ||
        url.includes('.png') ||
        url.includes('.webp') ||
        url.includes('.gif')
      );
    }
  }

  protected convertToAbsoluteUrl(url: string): string {
    if (!url) return '';

    // If already absolute, return as-is
    try {
      new URL(url);
      return url;
    } catch {
      // Convert relative URL to absolute
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                     process.env.NEXT_PUBLIC_SITE_URL ||
                     process.env.NEXT_PUBLIC_APP_URL ||
                     'http://localhost:3000';
      return `${baseUrl}${url}`;
    }
  }

  protected validateTitle(title: string): string {
    const maxLength = this.platform.configuration?.max_title_length || 100;
    return title.length > maxLength ? title.substring(0, maxLength - 3) + '...' : title;
  }

  protected validateDescription(description: string): string {
    const maxLength = this.platform.configuration?.max_description_length || 5000;
    return description.length > maxLength ? description.substring(0, maxLength - 3) + '...' : description;
  }

  // Generate listing data from product and template
  public generateListingData(
    product: ProductWithImages,
    template: ListingTemplate,
    categoryMapping?: Record<string, string>,
    quantity?: number
  ): ListingData {
    const adjustedPrice = this.formatPrice(
      product.price,
      template.price_adjustment_type !== 'none'
        ? { type: template.price_adjustment_type, value: template.price_adjustment_value }
        : undefined
    );

    const title = this.validateTitle(
      this.processTemplate(template.title_template || '{{product_name}}', product, adjustedPrice)
    );

    const description = this.validateDescription(
      this.processTemplate(template.description_template || '{{product_description}}', product, adjustedPrice)
    );

    const images = this.validateImages(product.images || []);

    const category = categoryMapping && product.category_name
      ? categoryMapping[product.category_name.toLowerCase().replace(/\s+/g, '-')]
      : undefined;

    // Generate product URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const productUrl = baseUrl ? `${baseUrl}/products/${product.id}` : undefined;

    return {
      title,
      description,
      price: adjustedPrice,
      images,
      category,
      condition: 'new',
      quantity: quantity || 1, // Default to 1 if no quantity provided
      productId: product.id,
      productUrl,
      shipping: {
        available: true,
        cost: 0
      }
    };
  }
}

// Factory function to create platform services
export async function createPlatformService(
  platform: ListingPlatform,
  credentials?: PlatformCredentials
): Promise<BasePlatformService> {
  switch (platform.name) {
    case 'ebay': {
      const { EbayService } = await import('./ebay');
      return new EbayService(platform, credentials);
    }
    case 'facebook_marketplace': {
      const { FacebookService } = await import('./facebook');
      return new FacebookService(platform, credentials);
    }
    case 'amazon': {
      const { AmazonService } = await import('./amazon');
      return new AmazonService(platform, credentials);
    }
    case 'ksl': {
      const { KslService } = await import('./ksl');
      return new KslService(platform, credentials);
    }
    case 'offerup': {
      const { OfferUpService } = await import('./offerup');
      return new OfferUpService(platform, credentials);
    }
    case 'nextdoor': {
      const { NextdoorService } = await import('./nextdoor');
      return new NextdoorService(platform, credentials);
    }
    case 'craigslist': {
      const { CraigslistService } = await import('./craigslist');
      return new CraigslistService(platform, credentials);
    }
    default:
      throw new Error(`Unsupported platform: ${platform.name}`);
  }
}
