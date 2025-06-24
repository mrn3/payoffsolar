// Facebook Marketplace API integration service
import { BasePlatformService, ListingData, ListingResult, PlatformCredentials } from './base';

interface FacebookCredentials extends PlatformCredentials {
  accessToken: string;
  pageId: string;
  catalogId: string;
}

export class FacebookService extends BasePlatformService {
  private facebookCredentials: FacebookCredentials;

  constructor(platform: any, credentials?: FacebookCredentials) {
    super(platform, credentials);
    this.facebookCredentials = credentials as FacebookCredentials;
  }

  protected hasRequiredCredentials(): boolean {
    return !!(
      this.facebookCredentials?.accessToken &&
      this.facebookCredentials?.pageId &&
      this.facebookCredentials?.catalogId
    );
  }

  async authenticate(): Promise<boolean> {
    if (!this.validateCredentials()) {
      return false;
    }

    try {
      // Test authentication with a simple API call
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${this.facebookCredentials.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Facebook authentication failed:', {
          status: response.status,
          error: error
        });
        return false;
      }

      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('Facebook authentication failed:', error);
      return false;
    }
  }

  async createListing(data: ListingData): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      // For Product Catalog, we use image URLs directly instead of uploading
      const imageUrls = data.images.slice(0, 20); // Facebook allows up to 20 images

      // Validate that we have at least one image
      if (!imageUrls.length || !imageUrls[0]) {
        return {
          success: false,
          error: 'At least one product image is required for Facebook Marketplace'
        };
      }

      // Check if we have any valid public URLs (not localhost)
      const publicImageUrls = imageUrls.filter(url =>
        url && !url.includes('localhost') && !url.includes('127.0.0.1')
      );

      console.log('Facebook listing - Original image URLs:', imageUrls);
      console.log('Facebook listing - Public image URLs:', publicImageUrls);
      console.log('Facebook listing - Environment variables:', {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
      });

      if (publicImageUrls.length === 0) {
        return {
          success: false,
          error: `Facebook Marketplace requires publicly accessible image URLs. Found URLs: ${imageUrls.join(', ')}. Please ensure your server has a public domain and set NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_SITE_URL, or NEXT_PUBLIC_APP_URL environment variable.`
        };
      }

      // Validate and format price
      const priceInCents = Math.round(Number(data.price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        return {
          success: false,
          error: 'Invalid price value for Facebook listing'
        };
      }

      // Create the marketplace listing using Product Catalog - minimal required fields only
      const listingData: any = {
        name: data.title,
        description: this.stripHtml(data.description || 'Solar equipment'),
        price: priceInCents, // Facebook expects price in cents
        currency: 'USD',
        condition: 'new',
        availability: 'in stock',
        retailer_id: `ps_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        image_url: publicImageUrls[0] // Use the first valid public image URL
      };

      console.log('Facebook listing data:', JSON.stringify(listingData, null, 2));
      console.log('Using catalog ID:', this.facebookCredentials.catalogId);
      console.log('Using access token (first 20 chars):', this.facebookCredentials.accessToken.substring(0, 20) + '...');

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${this.facebookCredentials.catalogId}/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          },
          body: JSON.stringify(listingData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Facebook API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
          requestData: listingData
        });

        // Extract more detailed error information
        let errorMessage = `Failed to create Facebook listing (${response.status})`;
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.error_user_msg) {
          errorMessage = error.error.error_user_msg;
        }

        // Check for authentication/token errors
        if (this.isAuthenticationError(response.status, error)) {
          errorMessage = this.getAuthErrorMessage();
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      const result = await response.json();
      console.log('Facebook API Success Response:', result);
      console.log('Result ID:', result.id);
      console.log('Full result object:', JSON.stringify(result, null, 2));

      if (!result.id) {
        console.error('No ID in Facebook response:', result);
        return {
          success: false,
          error: 'Facebook did not return a product ID'
        };
      }

      return {
        success: true,
        listingId: result.id,
        listingUrl: `https://www.facebook.com/marketplace/item/${result.id}`
      };
    } catch (error) {
      console.error('Facebook listing creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateListing(listingId: string, data: Partial<ListingData>): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      const updateData: any = {};

      if (data.title) updateData.name = data.title;
      if (data.description) updateData.description = data.description;
      if (data.price) updateData.price = Math.round(data.price * 100);
      if (data.category) updateData.category = this.mapCategory(data.category);

      // Handle image updates if provided
      if (data.images && data.images.length > 0) {
        const imageUrls = data.images.slice(0, 20);
        // Filter out localhost URLs for Facebook
        const publicImageUrls = imageUrls.filter(url =>
          url && !url.includes('localhost') && !url.includes('127.0.0.1')
        );

        if (publicImageUrls.length > 0) {
          updateData.image_url = publicImageUrls[0];
          updateData.additional_image_urls = publicImageUrls.slice(1);
        }
      }

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${listingId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error?.message || 'Failed to update Facebook listing';

        // Check for authentication/token errors
        if (this.isAuthenticationError(response.status, error)) {
          errorMessage = this.getAuthErrorMessage();
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        listingId,
        listingUrl: `https://www.facebook.com/marketplace/item/${listingId}`
      };
    } catch (error) {
      console.error('Facebook listing update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteListing(listingId: string): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error?.message || 'Failed to delete Facebook listing';

        // Check for authentication/token errors
        if (this.isAuthenticationError(response.status, error)) {
          errorMessage = this.getAuthErrorMessage();
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Facebook listing deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getListingStatus(listingId: string): Promise<{ status: string; url?: string }> {
    if (!this.validateCredentials()) {
      return { status: 'error' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${listingId}?fields=availability,review_status`,
        {
          headers: {
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        // Check if it's an authentication error
        if (this.isAuthenticationError(response.status, error)) {
          return { status: 'auth_error' };
        }
        return { status: 'error' };
      }

      const data = await response.json();
      const status = this.mapFacebookStatus(data.availability, data.review_status);
      
      return {
        status,
        url: `https://www.facebook.com/marketplace/item/${listingId}`
      };
    } catch (error) {
      console.error('Facebook status check failed:', error);
      return { status: 'error' };
    }
  }



  private mapCategory(category?: string): string {
    // Facebook Product Catalog categories for solar equipment
    const categoryMap: Record<string, string> = {
      'solar-panels': 'Home & Garden > Home Improvement > Solar Panels',
      'inverters': 'Electronics > Power Supplies > Inverters',
      'batteries': 'Electronics > Batteries',
      'mounting-systems': 'Home & Garden > Home Improvement > Solar Panel Mounting',
      'accessories': 'Electronics > Electronic Accessories'
    };

    return categoryMap[category || ''] || 'Home & Garden > Home Improvement';
  }

  private mapFacebookStatus(availability?: string, reviewStatus?: string): string {
    if (reviewStatus === 'PENDING') return 'pending';
    if (reviewStatus === 'REJECTED') return 'error';
    if (availability === 'in stock') return 'active';
    if (availability === 'out of stock') return 'paused';
    if (availability === 'available for order') return 'active';
    if (availability === 'preorder') return 'active';
    if (availability === 'discontinued') return 'paused';
    if (availability === 'pending') return 'pending';
    if (availability === 'mark_as_sold') return 'paused';
    return 'unknown';
  }

  private isAuthenticationError(status: number, error: any): boolean {
    return status === 401 ||
           (error.error?.code && ['190', '102', '463'].includes(error.error.code.toString()));
  }

  private getAuthErrorMessage(): string {
    return 'Error validating access token: Session has expired. Please update your Facebook access token in Platform Settings.';
  }
}
