import React, { useState, useEffect } from 'react';
import { ListingPlatform } from '@/lib/models';
import { FaTimes, FaSpinner, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

interface PlatformEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: ListingPlatform | null;
  onSave: () => void;
}

interface PlatformCredentials {
  [key: string]: string;
}

export default function PlatformEditModal({ 
  isOpen, 
  onClose, 
  platform, 
  onSave 
}: PlatformEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    api_endpoint: '',
    requires_auth: false,
    is_active: true,
    configuration: {},
    credentials: {} as PlatformCredentials
  });

  useEffect(() => {
    if (platform) {
      setFormData({
        display_name: platform.display_name || '',
        api_endpoint: platform.api_endpoint || '',
        requires_auth: platform.requires_auth || false,
        is_active: platform.is_active || true,
        configuration: platform.configuration || {},
        credentials: platform.credentials || {}
      });
    }
  }, [platform]);

  const getCredentialFields = (platformName: string) => {
    switch (platformName) {
      case 'facebook_marketplace':
        return [
          { key: 'accessToken', label: 'Access Token', type: 'password' },
          { key: 'pageId', label: 'Page ID', type: 'text' },
          { key: 'catalogId', label: 'Product Catalog ID', type: 'text' }
        ];
      case 'ebay':
        return [
          { key: 'appId', label: 'App ID', type: 'text' },
          { key: 'devId', label: 'Dev ID', type: 'text' },
          { key: 'certId', label: 'Cert ID', type: 'password' },
          { key: 'userToken', label: 'User Token', type: 'password' }
        ];
      case 'amazon':
        return [
          { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
          { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
          { key: 'sellerId', label: 'Seller ID', type: 'text' },
          { key: 'marketplaceId', label: 'Marketplace ID', type: 'text' },
          { key: 'region', label: 'Region', type: 'text' }
        ];
      case 'ksl':
        return [
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      case 'offerup':
        return [
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      case 'nextdoor':
        return [
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      case 'craigslist':
        return [
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      default:
        return [];
    }
  };

  const getPlatformSetupInfo = (platformName: string) => {
    switch (platformName) {
      case 'facebook_marketplace':
        return {
          setupUrl: 'https://developers.facebook.com/apps/',
          instructions: [
            '1. Go to Facebook Developers and create a new app',
            '2. Add the "Marketing API" product to your app',
            '3. Create a Facebook Business Page if you don\'t have one',
            '4. Create a Product Catalog in Facebook Business Manager',
            '5. Generate an access token with "catalog_management" and "pages_show_list" permissions',
            '6. Get your Page ID from your Facebook Business Page settings',
            '7. Get your Product Catalog ID from Facebook Business Manager > Catalog'
          ],
          docs: 'https://developers.facebook.com/docs/marketing-api/catalog'
        };
      case 'ebay':
        return {
          setupUrl: 'https://developer.ebay.com/my/keys',
          instructions: [
            '1. Create an eBay Developer account at developer.ebay.com',
            '2. Create a new application in your developer dashboard',
            '3. Get your App ID (Client ID), Dev ID, and Cert ID (Client Secret)',
            '4. Generate a User Token using the "Get a User Token" tool',
            '5. For production, you\'ll need to have your app reviewed by eBay'
          ],
          docs: 'https://developer.ebay.com/api-docs/static/gs_create-the-ebay-api-keysets.html'
        };
      case 'amazon':
        return {
          setupUrl: 'https://sellercentral.amazon.com/apps/manage',
          instructions: [
            '1. Register as an Amazon seller at sellercentral.amazon.com',
            '2. Go to Apps & Services > Develop apps for Amazon',
            '3. Create a new developer profile and app',
            '4. Get your Access Key ID and Secret Access Key from AWS IAM',
            '5. Find your Seller ID in Seller Central settings',
            '6. Use marketplace ID: A1VC38T7YXB528 for US marketplace'
          ],
          docs: 'https://developer-docs.amazon.com/sp-api/docs/registering-your-application'
        };
      case 'ksl':
        return {
          setupUrl: 'https://www.ksl.com/',
          instructions: [
            '1. Create a KSL account at ksl.com',
            '2. Verify your account with a phone number',
            '3. Use your regular KSL login credentials',
            '4. Note: KSL doesn\'t have an official API, this uses web automation'
          ],
          docs: 'https://www.ksl.com/help'
        };
      case 'offerup':
        return {
          setupUrl: 'https://offerup.com/',
          instructions: [
            '1. Create an OfferUp account at offerup.com',
            '2. Verify your account with a phone number',
            '3. Use your regular OfferUp login credentials',
            '4. Note: OfferUp doesn\'t have a public API, this uses web automation'
          ],
          docs: 'https://offerup.com/support/'
        };
      case 'nextdoor':
        return {
          setupUrl: 'https://nextdoor.com/',
          instructions: [
            '1. Create a Nextdoor account at nextdoor.com',
            '2. Verify your address and join your neighborhood',
            '3. Use your regular Nextdoor login credentials',
            '4. Note: Nextdoor doesn\'t have a public API, this uses web automation'
          ],
          docs: 'https://help.nextdoor.com/'
        };
      case 'craigslist':
        return {
          setupUrl: 'https://craigslist.org/',
          instructions: [
            '1. Create a Craigslist account (varies by city)',
            '2. Verify your account with a phone number',
            '3. Use your regular Craigslist login credentials',
            '4. Note: Craigslist doesn\'t have an official API, this uses web automation'
          ],
          docs: 'https://www.craigslist.org/about/help/'
        };
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/listing/platforms/${platform.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update platform');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating platform:', error);
      alert('Failed to update platform. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  if (!isOpen || !platform) return null;

  const credentialFields = getCredentialFields(platform.name);
  const setupInfo = getPlatformSetupInfo(platform.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {platform.display_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <input
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://api.example.com"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_auth}
                onChange={(e) => setFormData(prev => ({ ...prev, requires_auth: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Requires Authentication</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          {/* Setup Information */}
          {setupInfo && (
            <div className="border-t pt-4">
              <div className="flex items-center mb-3">
                <FaInfoCircle className="h-4 w-4 text-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">Setup Instructions</h4>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Get Started:</span>
                  <a
                    href={setupInfo.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    Open Setup Page
                    <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  {setupInfo.instructions.map((instruction, index) => (
                    <div key={index} className="text-sm text-blue-800">
                      {instruction}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <a
                    href={setupInfo.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Documentation
                    <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {formData.requires_auth && credentialFields.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Credentials</h4>
                {setupInfo && (
                  <span className="text-xs text-gray-500">
                    See setup instructions above for help
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {credentialFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData.credentials[field.key] || ''}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 flex items-center"
            >
              {loading && <FaSpinner className="animate-spin mr-2 h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
