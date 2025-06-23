// Facebook Marketplace API integration service
import { BasePlatformService, ListingData, ListingResult, PlatformCredentials } from './base';

interface FacebookCredentials extends PlatformCredentials {
  accessToken: string;
  pageId: string;
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
      this.facebookCredentials?.pageId
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
      // First, upload images if any
      const imageIds: string[] = [];
      for (const imageUrl of data.images.slice(0, 20)) { // Facebook allows up to 20 images
        const imageId = await this.uploadImage(imageUrl);
        if (imageId) {
          imageIds.push(imageId);
        }
      }

      // Create the marketplace listing
      const listingData = {
        name: data.title,
        description: data.description,
        price: Math.round(data.price * 100), // Facebook expects price in cents
        currency: 'USD',
        category: this.mapCategory(data.category),
        condition: 'NEW',
        availability: 'IN_STOCK',
        brand: 'Payoff Solar',
        retailer_id: `product_${Date.now()}`,
        images: imageIds.map(id => ({ id })),
        custom_label_0: data.category || 'solar_equipment'
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.facebookCredentials.pageId}/products`,
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
        return {
          success: false,
          error: error.error?.message || 'Failed to create Facebook listing'
        };
      }

      const result = await response.json();
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
        const imageIds: string[] = [];
        for (const imageUrl of data.images.slice(0, 20)) {
          const imageId = await this.uploadImage(imageUrl);
          if (imageId) {
            imageIds.push(imageId);
          }
        }
        updateData.images = imageIds.map(id => ({ id }));
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${listingId}`,
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
        return {
          success: false,
          error: error.error?.message || 'Failed to update Facebook listing'
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
        `https://graph.facebook.com/v18.0/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Failed to delete Facebook listing'
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
        `https://graph.facebook.com/v18.0/${listingId}?fields=availability,review_status`,
        {
          headers: {
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          }
        }
      );

      if (!response.ok) {
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

  private async uploadImage(imageUrl: string): Promise<string | null> {
    try {
      // Download the image first
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return null;
      }

      const imageBlob = await imageResponse.blob();
      const formData = new FormData();
      formData.append('source', imageBlob);

      // Upload to Facebook
      const uploadResponse = await fetch(
        `https://graph.facebook.com/v18.0/${this.facebookCredentials.pageId}/photos`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.facebookCredentials.accessToken}`
          },
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        return null;
      }

      const result = await uploadResponse.json();
      return result.id;
    } catch (error) {
      console.error('Facebook image upload failed:', error);
      return null;
    }
  }

  private mapCategory(category?: string): string {
    const categoryMap: Record<string, string> = {
      'solar-panels': 'home_garden',
      'inverters': 'electronics',
      'batteries': 'electronics',
      'mounting-systems': 'home_garden',
      'accessories': 'electronics'
    };

    return categoryMap[category || ''] || 'home_garden';
  }

  private mapFacebookStatus(availability?: string, reviewStatus?: string): string {
    if (reviewStatus === 'PENDING') return 'pending';
    if (reviewStatus === 'REJECTED') return 'error';
    if (availability === 'IN_STOCK') return 'active';
    if (availability === 'OUT_OF_STOCK') return 'paused';
    return 'unknown';
  }
}
