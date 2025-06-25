// Main listing service that orchestrates all platform integrations
import {
  ProductWithImages,
  ListingPlatform,
  ListingTemplate,
  ProductListing,
  ListingPlatformModel,
  ListingTemplateModel,
  ProductListingModel,
  ProductModel,
  ProductImageModel,
  PlatformCredentialsModel,
  InventoryModel
} from '@/lib/models';
import { createPlatformService, ListingResult } from './base';

export interface ListingRequest {
  productId: string;
  platformIds: string[];
  templateIds?: Record<string, string>; // platformId -> templateId mapping
  customData?: Record<string, any>;
}

export interface BulkListingResult {
  productId: string;
  results: Array<{
    platformId: string;
    platformName: string;
    success: boolean;
    listingId?: string;
    listingUrl?: string;
    error?: string;
    warnings?: string[];
  }>;
}

export class ListingService {
  // Helper method to create platform service with credentials
  private async createPlatformServiceWithCredentials(platform: ListingPlatform, userId: string) {
    const credentials = await PlatformCredentialsModel.getByUserAndPlatform(userId, platform.id);
    return createPlatformService(platform, credentials?.credentials);
  }

  // Create listings for a product on multiple platforms
  async createListings(request: ListingRequest, userId: string): Promise<BulkListingResult> {
    const { productId, platformIds, templateIds = {}, customData = {} } = request;

    // Fetch product with images
    const product = await ProductModel.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const images = await ProductImageModel.getByProductId(productId);
    const productWithImages: ProductWithImages = { ...product, images };

    // Fetch total inventory quantity across all warehouses
    const inventoryItems = await InventoryModel.getByProductId(productId);
    const totalQuantity = inventoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Fetch platforms
    const platforms = await Promise.all(
      platformIds.map(id => ListingPlatformModel.getById(id))
    );

    const results: BulkListingResult['results'] = [];

    // Process each platform
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (!platform) {
        results.push({
          platformId: platformIds[i],
          platformName: 'Unknown',
          success: false,
          error: 'Platform not found'
        });
        continue;
      }

      try {
        // Check if listing already exists
        const existingListing = await ProductListingModel.getByProductAndPlatform(
          productId,
          platform.id
        );

        if (existingListing) {
          results.push({
            platformId: platform.id,
            platformName: platform.display_name,
            success: false,
            error: 'Listing already exists for this platform'
          });
          continue;
        }

        // Get template
        const templateId = templateIds[platform.id];
        const template = templateId 
          ? await ListingTemplateModel.getById(templateId)
          : await ListingTemplateModel.getDefaultByPlatformId(platform.id);

        if (!template) {
          results.push({
            platformId: platform.id,
            platformName: platform.display_name,
            success: false,
            error: 'No template found for platform'
          });
          continue;
        }

        // Create platform service with credentials
        const platformService = await this.createPlatformServiceWithCredentials(platform, userId);
        
        // Generate listing data
        const listingData = platformService.generateListingData(
          productWithImages,
          template,
          template.category_mapping,
          totalQuantity
        );

        // Apply custom data overrides
        if (customData[platform.id]) {
          Object.assign(listingData, customData[platform.id]);
        }

        // Create the listing
        const result = await platformService.createListing(listingData);

        // Save to database
        if (result.success && result.listingId) {
          await ProductListingModel.create({
            product_id: productId,
            platform_id: platform.id,
            template_id: template.id,
            external_listing_id: result.listingId,
            title: listingData.title,
            description: listingData.description,
            price: listingData.price,
            status: 'active',
            listing_url: result.listingUrl,
            auto_sync: true
          });
        } else if (!result.success) {
          // Save failed listing for tracking
          await ProductListingModel.create({
            product_id: productId,
            platform_id: platform.id,
            template_id: template.id,
            title: listingData.title,
            description: listingData.description,
            price: listingData.price,
            status: 'error',
            error_message: result.error,
            auto_sync: false
          });
        }

        results.push({
          platformId: platform.id,
          platformName: platform.display_name,
          success: result.success,
          listingId: result.listingId,
          listingUrl: result.listingUrl,
          error: result.error,
          warnings: result.warnings
        });

      } catch (error) {
        console.error(`Error creating listing for platform ${platform.name}:`, error);
        results.push({
          platformId: platform.id,
          platformName: platform.display_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      productId,
      results
    };
  }

  // Update existing listings for a product
  async updateListings(productId: string, userId: string, platformIds?: string[]): Promise<BulkListingResult> {
    // Fetch product with images
    const product = await ProductModel.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const images = await ProductImageModel.getByProductId(productId);
    const productWithImages: ProductWithImages = { ...product, images };

    // Fetch total inventory quantity across all warehouses
    const inventoryItems = await InventoryModel.getByProductId(productId);
    const totalQuantity = inventoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Get existing listings
    const existingListings = await ProductListingModel.getByProductId(productId);
    const listingsToUpdate = platformIds 
      ? existingListings.filter(listing => platformIds.includes(listing.platform_id))
      : existingListings;

    const results: BulkListingResult['results'] = [];

    for (const listing of listingsToUpdate) {
      try {
        const platform = await ListingPlatformModel.getById(listing.platform_id);
        if (!platform) {
          results.push({
            platformId: listing.platform_id,
            platformName: 'Unknown',
            success: false,
            error: 'Platform not found'
          });
          continue;
        }

        const template = listing.template_id 
          ? await ListingTemplateModel.getById(listing.template_id)
          : await ListingTemplateModel.getDefaultByPlatformId(platform.id);

        if (!template) {
          results.push({
            platformId: platform.id,
            platformName: platform.display_name,
            success: false,
            error: 'No template found'
          });
          continue;
        }

        // Create platform service with credentials
        const platformService = await this.createPlatformServiceWithCredentials(platform, userId);
        
        // Generate updated listing data
        const listingData = platformService.generateListingData(
          productWithImages,
          template,
          template.category_mapping,
          totalQuantity
        );

        // Update the listing
        const result = await platformService.updateListing(
          listing.external_listing_id || '',
          listingData
        );

        // Update database
        await ProductListingModel.update(listing.id, {
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          status: result.success ? 'active' : 'error',
          error_message: result.error || undefined
        });

        results.push({
          platformId: platform.id,
          platformName: platform.display_name,
          success: result.success,
          listingId: result.listingId,
          listingUrl: result.listingUrl,
          error: result.error,
          warnings: result.warnings
        });

      } catch (error) {
        console.error(`Error updating listing:`, error);
        results.push({
          platformId: listing.platform_id,
          platformName: 'Unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      productId,
      results
    };
  }

  // Delete listings for a product
  async deleteListings(productId: string, userId: string, platformIds?: string[]): Promise<BulkListingResult> {
    console.log('Starting deleteListings for product:', productId, 'platforms:', platformIds);
    const existingListings = await ProductListingModel.getByProductId(productId);
    const listingsToDelete = platformIds 
      ? existingListings.filter(listing => platformIds.includes(listing.platform_id))
      : existingListings;

    const results: BulkListingResult['results'] = [];

    for (const listing of listingsToDelete) {
      try {
        const platform = await ListingPlatformModel.getById(listing.platform_id);
        if (!platform) {
          results.push({
            platformId: listing.platform_id,
            platformName: 'Unknown',
            success: false,
            error: 'Platform not found'
          });
          continue;
        }

        // Create platform service with credentials
        const platformService = await this.createPlatformServiceWithCredentials(platform, userId);

        console.log(`Attempting to delete listing for platform ${platform.display_name}:`, {
          listingId: listing.id,
          externalListingId: listing.external_listing_id,
          currentStatus: listing.status,
          currentError: listing.error_message
        });

        // If the listing is in error state or has no external listing ID, just delete the database record
        if (listing.status === 'error' || !listing.external_listing_id) {
          console.log(`Deleting error listing or listing without external ID for platform ${platform.display_name}`);
          await ProductListingModel.delete(listing.id);

          results.push({
            platformId: platform.id,
            platformName: platform.display_name,
            success: true,
            warnings: ['Listing was in error state - removed from database without platform deletion']
          });
          continue;
        }

        // Delete the listing from the platform
        const result = await platformService.deleteListing(
          listing.external_listing_id
        );

        console.log(`Delete result for platform ${platform.display_name}:`, result);

        // Update database status
        if (result.success) {
          await ProductListingModel.update(listing.id, {
            status: 'ended',
            error_message: undefined
          });
        } else {
          // If deletion failed, update the error message
          await ProductListingModel.update(listing.id, {
            error_message: result.error || 'Failed to delete listing'
          });
        }

        results.push({
          platformId: platform.id,
          platformName: platform.display_name,
          success: result.success,
          error: result.error,
          warnings: result.warnings
        });

      } catch (error) {
        console.error(`Error deleting listing:`, error);
        results.push({
          platformId: listing.platform_id,
          platformName: 'Unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      productId,
      results
    };
  }

  // Sync listing statuses
  async syncListingStatuses(userId: string, productId?: string): Promise<void> {
    const listings = productId 
      ? await ProductListingModel.getByProductId(productId)
      : await ProductListingModel.getAll();

    for (const listing of listings) {
      try {
        if (!listing.external_listing_id) continue;

        const platform = await ListingPlatformModel.getById(listing.platform_id);
        if (!platform) continue;

        const platformService = await this.createPlatformServiceWithCredentials(platform, userId);
        const status = await platformService.getListingStatus(listing.external_listing_id);

        await ProductListingModel.update(listing.id, {
          status: status.status as any,
          listing_url: status.url || listing.listing_url
        });

      } catch (error) {
        console.error(`Error syncing listing status:`, error);
      }
    }
  }
}

// Export singleton instance
export const listingService = new ListingService();
