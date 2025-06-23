import React, { useState, useEffect } from 'react';
import { ListingPlatform } from '@/lib/models';
import { FaTimes, FaSpinner } from 'react-icons/fa';

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
          { key: 'pageId', label: 'Page ID', type: 'text' }
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
          { key: 'email', label: 'Email', type: 'email' }
        ];
      default:
        return [];
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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

          {formData.requires_auth && credentialFields.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Credentials</h4>
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
