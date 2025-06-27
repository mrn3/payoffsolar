'use client';

import React, { useState, useEffect } from 'react';
import { SiteSetting } from '@/lib/models';
import { FaSave, FaSpinner, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string' as 'string' | 'number' | 'boolean' | 'json',
    description: '',
    is_public: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        
        // Initialize editing state with current values
        const editingState: Record<string, string> = {};
        data.settings.forEach((setting: SiteSetting) => {
          editingState[setting.setting_key] = setting.setting_value || '';
        });
        setEditingSettings(editingState);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = settings.map(async (setting) => {
        const newValue = editingSettings[setting.setting_key];
        if (newValue !== setting.setting_value) {
          const response = await fetch(`/api/settings/${setting.setting_key}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setting_value: newValue })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update ${setting.setting_key}`);
          }
        }
      });

      await Promise.all(promises);
      await fetchSettings();
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    if (!newSetting.setting_key.trim()) {
      toast.error('Setting key is required');
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting)
      });

      if (response.ok) {
        await fetchSettings();
        setShowAddForm(false);
        setNewSetting({
          setting_key: '',
          setting_value: '',
          setting_type: 'string',
          description: '',
          is_public: false
        });
        toast.success('Setting added successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add setting');
      }
    } catch (error) {
      console.error('Error adding setting:', error);
      toast.error('Failed to add setting');
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSettings();
        toast.success('Setting deleted successfully');
      } else {
        toast.error('Failed to delete setting');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Site Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure site-wide settings including Google Analytics and other options.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Setting
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <FaSpinner className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <FaSave className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Add Setting Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Setting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting Key
              </label>
              <input
                type="text"
                value={newSetting.setting_key}
                onChange={(e) => setNewSetting(prev => ({ ...prev, setting_key: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., google_analytics_id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting Value
              </label>
              <input
                type="text"
                value={newSetting.setting_value}
                onChange={(e) => setNewSetting(prev => ({ ...prev, setting_value: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Setting value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newSetting.setting_type}
                onChange={(e) => setNewSetting(prev => ({ ...prev, setting_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <label className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={newSetting.is_public}
                  onChange={(e) => setNewSetting(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Public Setting</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newSetting.description}
                onChange={(e) => setNewSetting(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Description of this setting"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={handleAddSetting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Add Setting
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Settings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {settings.map((setting) => (
            <div key={setting.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900">{setting.setting_key}</h3>
                    {setting.is_public && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Public
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {setting.setting_type}
                    </span>
                  </div>
                  {setting.description && (
                    <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                  )}
                  <div className="max-w-md">
                    {setting.setting_type === 'boolean' ? (
                      <select
                        value={editingSettings[setting.setting_key] || ''}
                        onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : setting.setting_type === 'json' ? (
                      <textarea
                        value={editingSettings[setting.setting_key] || ''}
                        onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="JSON value"
                      />
                    ) : (
                      <input
                        type={setting.setting_type === 'number' ? 'number' : 'text'}
                        value={editingSettings[setting.setting_key] || ''}
                        onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={setting.setting_key === 'google_analytics_id' ? 'G-XXXXXXXXXX' : 'Setting value'}
                      />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSetting(setting.setting_key)}
                  className="ml-4 text-red-600 hover:text-red-800"
                  title="Delete setting"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {settings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No settings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
