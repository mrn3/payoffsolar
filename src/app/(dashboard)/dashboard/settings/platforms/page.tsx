'use client';

import React, { useState, useEffect } from 'react';
import { ListingPlatform, ListingTemplateWithPlatform } from '@/lib/models';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';
import PlatformEditModal from '@/components/settings/PlatformEditModal';

export default function PlatformSettingsPage() {
  const [platforms, setPlatforms] = useState<ListingPlatform[]>([]);
  const [templates, setTemplates] = useState<ListingTemplateWithPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [editingPlatform, setEditingPlatform] = useState<ListingPlatform | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchPlatforms();
    fetchTemplates();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/listing/platforms');
      const data = await response.json();
      setPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/listing/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatformStatus = async (platformId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/listing/platforms/${platformId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        await fetchPlatforms();
      }
    } catch (error) {
      console.error('Error updating platform status:', error);
    }
  };

  const handleEditPlatform = (platform: ListingPlatform) => {
    setEditingPlatform(platform);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPlatform(null);
  };

  const handleSavePlatform = async () => {
    await fetchPlatforms();
  };

  const filteredTemplates = selectedPlatform 
    ? templates.filter(t => t.platform_id === selectedPlatform)
    : templates;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-gray-500 mr-2" />
        <span>Loading platform settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure marketplace platforms and listing templates.
        </p>
      </div>

      {/* Platforms Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Listing Platforms</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              <FaPlus className="mr-2 h-4 w-4" />
              Add Platform
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requires Auth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {platforms.map((platform) => (
                <tr key={platform.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {platform.display_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {platform.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => togglePlatformStatus(platform.id, platform.is_active)}
                      className={`flex items-center ${
                        platform.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {platform.is_active ? (
                        <FaToggleOn className="h-6 w-6" />
                      ) : (
                        <FaToggleOff className="h-6 w-6" />
                      )}
                      <span className="ml-2 text-sm">
                        {platform.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {platform.api_endpoint || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      platform.requires_auth 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {platform.requires_auth ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPlatform(platform)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit platform"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Delete platform">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Listing Templates</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">All Platforms</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.display_name}
                  </option>
                ))}
              </select>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                <FaPlus className="mr-2 h-4 w-4" />
                Add Template
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {template.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.platform_display_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.price_adjustment_type === 'none' 
                      ? 'None' 
                      : `${template.price_adjustment_type === 'percentage' ? '' : '$'}${template.price_adjustment_value}${template.price_adjustment_type === 'percentage' ? '%' : ''}`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.is_default 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_default ? 'Default' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {selectedPlatform 
                ? 'No templates found for the selected platform.' 
                : 'No templates found.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Platform Modal */}
      <PlatformEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        platform={editingPlatform}
        onSave={handleSavePlatform}
      />
    </div>
  );
}
