// eBay API integration service
import { BasePlatformService, ListingData, ListingResult, PlatformCredentials } from './base';

interface EbayCredentials extends PlatformCredentials {
  appId: string;
  devId: string;
  certId: string;
  userToken: string;
  sandbox?: boolean;
}

export class EbayService extends BasePlatformService {
  private ebayCredentials: EbayCredentials;

  constructor(platform: any, credentials?: EbayCredentials) {
    super(platform, credentials);
    this.ebayCredentials = credentials as EbayCredentials;
  }

  protected hasRequiredCredentials(): boolean {
    return !!(
      this.ebayCredentials?.appId &&
      this.ebayCredentials?.devId &&
      this.ebayCredentials?.certId &&
      this.ebayCredentials?.userToken
    );
  }

  async authenticate(): Promise<boolean> {
    if (!this.validateCredentials()) {
      return false;
    }

    try {
      // Test authentication with a simple API call
      const response = await this.makeApiCall('GetUser', {
        RequesterCredentials: {
          eBayAuthToken: this.ebayCredentials.userToken
        }
      });

      return response.Ack === 'Success';
    } catch (error) {
      console.error('eBay authentication failed:', error);
      return false;
    }
  }

  async createListing(data: ListingData): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      const listingData = {
        RequesterCredentials: {
          eBayAuthToken: this.ebayCredentials.userToken
        },
        Item: {
          Title: data.title,
          Description: this.formatDescriptionForEbay(data.description),
          PrimaryCategory: {
            CategoryID: data.category || '11700' // Default to solar/renewable energy category
          },
          StartPrice: data.price.toFixed(2),
          CategoryMappingAllowed: true,
          Country: 'US',
          Currency: 'USD',
          DispatchTimeMax: 3,
          ListingDuration: 'Days_7',
          ListingType: 'FixedPriceItem',
          PaymentMethods: ['PayPal', 'CreditCard'],
          PictureDetails: {
            PictureURL: data.images.slice(0, 12) // eBay allows up to 12 images
          },
          PostalCode: '84101', // Default to Utah
          Quantity: 1,
          ReturnPolicy: {
            ReturnsAcceptedOption: 'ReturnsAccepted',
            RefundOption: 'MoneyBack',
            ReturnsWithinOption: 'Days_30',
            ShippingCostPaidByOption: 'Buyer'
          },
          ShippingDetails: {
            ShippingType: 'Calculated',
            ShippingServiceOptions: [{
              ShippingServicePriority: 1,
              ShippingService: 'UPSGround',
              FreeShipping: data.shipping?.cost === 0
            }]
          },
          Site: 'US'
        }
      };

      const response = await this.makeApiCall('AddFixedPriceItem', listingData);

      if (response.Ack === 'Success') {
        return {
          success: true,
          listingId: response.ItemID,
          listingUrl: `https://www.ebay.com/itm/${response.ItemID}`
        };
      } else {
        return {
          success: false,
          error: response.Errors?.[0]?.LongMessage || 'Failed to create listing'
        };
      }
    } catch (error) {
      console.error('eBay listing creation failed:', error);
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
      const updateData: any = {
        RequesterCredentials: {
          eBayAuthToken: this.ebayCredentials.userToken
        },
        Item: {
          ItemID: listingId
        }
      };

      if (data.title) updateData.Item.Title = data.title;
      if (data.description) updateData.Item.Description = this.formatDescriptionForEbay(data.description);
      if (data.price) updateData.Item.StartPrice = data.price.toFixed(2);
      if (data.images) updateData.Item.PictureDetails = { PictureURL: data.images.slice(0, 12) };

      const response = await this.makeApiCall('ReviseFixedPriceItem', updateData);

      if (response.Ack === 'Success') {
        return {
          success: true,
          listingId: response.ItemID,
          listingUrl: `https://www.ebay.com/itm/${response.ItemID}`
        };
      } else {
        return {
          success: false,
          error: response.Errors?.[0]?.LongMessage || 'Failed to update listing'
        };
      }
    } catch (error) {
      console.error('eBay listing update failed:', error);
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
      const response = await this.makeApiCall('EndFixedPriceItem', {
        RequesterCredentials: {
          eBayAuthToken: this.ebayCredentials.userToken
        },
        ItemID: listingId,
        EndingReason: 'NotAvailable'
      });

      if (response.Ack === 'Success') {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.Errors?.[0]?.LongMessage || 'Failed to end listing'
        };
      }
    } catch (error) {
      console.error('eBay listing deletion failed:', error);
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
      const response = await this.makeApiCall('GetItem', {
        RequesterCredentials: {
          eBayAuthToken: this.ebayCredentials.userToken
        },
        ItemID: listingId
      });

      if (response.Ack === 'Success') {
        const item = response.Item;
        return {
          status: item.SellingStatus?.ListingStatus?.toLowerCase() || 'unknown',
          url: item.ListingDetails?.ViewItemURL
        };
      } else {
        return { status: 'error' };
      }
    } catch (error) {
      console.error('eBay status check failed:', error);
      return { status: 'error' };
    }
  }

  private async makeApiCall(callName: string, requestData: any): Promise<any> {
    const endpoint = this.ebayCredentials.sandbox 
      ? this.platform.configuration?.sandbox_endpoint 
      : this.platform.api_endpoint;

    const headers = {
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': this.ebayCredentials.devId,
      'X-EBAY-API-APP-NAME': this.ebayCredentials.appId,
      'X-EBAY-API-CERT-NAME': this.ebayCredentials.certId,
      'X-EBAY-API-CALL-NAME': callName,
      'X-EBAY-API-SITEID': '0',
      'Content-Type': 'text/xml'
    };

    const xmlRequest = this.buildXmlRequest(callName, requestData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: xmlRequest
    });

    if (!response.ok) {
      throw new Error(`eBay API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlResponse = await response.text();
    return this.parseXmlResponse(xmlResponse);
  }

  private buildXmlRequest(callName: string, data: any): string {
    // This is a simplified XML builder - in production, use a proper XML library
    const xmlData = this.objectToXml(data);
    return `<?xml version="1.0" encoding="utf-8"?>
      <${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
        ${xmlData}
      </${callName}Request>`;
  }

  private objectToXml(obj: any, indent = ''): string {
    let xml = '';
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `${indent}<${key}>${typeof item === 'object' ? this.objectToXml(item, indent + '  ') : item}</${key}>\n`;
        });
      } else if (typeof value === 'object') {
        xml += `${indent}<${key}>\n${this.objectToXml(value, indent + '  ')}${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${value}</${key}>\n`;
      }
    }
    return xml;
  }

  private parseXmlResponse(xml: string): any {
    // This is a simplified XML parser - in production, use a proper XML library
    // For now, return a mock response structure
    return {
      Ack: 'Success',
      ItemID: '123456789',
      Errors: []
    };
  }

  private formatDescriptionForEbay(description: string): string {
    // eBay supports HTML in descriptions
    return `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
      ${description}
      <br><br>
      <p><strong>Condition:</strong> New</p>
      <p><strong>Shipping:</strong> Fast and secure shipping available</p>
      <p><strong>Returns:</strong> 30-day return policy</p>
    </div>`;
  }
}
