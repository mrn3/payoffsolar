'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Contact } from '@/lib/models';
import { DuplicateGroup } from '@/lib/utils/duplicates';
import { FaTimes, FaExclamationTriangle, FaSync, FaCheck } from 'react-icons/fa';

interface DuplicateContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: () => void;
}

interface DuplicatesResponse {
  duplicateGroups: DuplicateGroup[];
  totalGroups: number;
  totalDuplicateContacts: number;
}

export default function DuplicateContactsModal({ isOpen, onClose, onMergeComplete }: DuplicateContactsModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [duplicateContact, setDuplicateContact] = useState<Contact | null>(null);
  const [mergedData, setMergedData] = useState<Partial<Contact>>({});
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicates();
    }
  }, [isOpen, threshold]);

  const findDuplicates = async () => {
    setStep('loading');
    setLoading(true);
    setError(null);

    try {
      const _response = await fetch(`/api/contacts/duplicates?threshold=${threshold}`);
      if (!_response.ok) {
        throw new Error('Failed to find duplicates');
      }

      const _data: DuplicatesResponse = await _response.json();
      setDuplicateGroups(_data.duplicateGroups);
      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    // Set the first contact as primary by default
    setPrimaryContact(group.contacts[0]);
    setDuplicateContact(group.contacts[1]);
    
    // Initialize merged data with primary contact data
    setMergedData({
      name: group.contacts[0].name,
      email: group.contacts[0].email,
      phone: group.contacts[0].phone,
      address: group.contacts[0].address,
      city: group.contacts[0].city,
      state: group.contacts[0].state,
      zip: group.contacts[0].zip,
      notes: group.contacts[0].notes
    });
    
    setStep('merge');
  };

  const handleMergeContacts = async () => {
    if (!primaryContact || !duplicateContact || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      const _response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryContactId: primaryContact.id,
          duplicateContactId: duplicateContact.id,
          mergedData
        })
      });

      if (!_response.ok) {
        const errorData = await _response.json();
        throw new Error(errorData.error || 'Failed to merge contacts');
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));
      
      // Reset state
      setSelectedGroup(null);
      setPrimaryContact(null);
      setDuplicateContact(null);
      setMergedData({});
      setStep('list');
      
      onMergeComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('merge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('loading');
    setDuplicateGroups([]);
    setSelectedGroup(null);
    setPrimaryContact(null);
    setDuplicateContact(null);
    setMergedData({});
    setError(null);
    onClose();
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'email': return 'bg-red-100 text-red-800';
      case 'phone': return 'bg-orange-100 text-orange-800';
      case 'name': return 'bg-blue-100 text-blue-800';
      case 'multiple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Find and Merge Duplicate Contacts
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Scanning for duplicate contacts...</p>
          </div>
        )}

        {/* List Step */}
        {step === 'list' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Similarity Threshold:
                </label>
                <select
                  value={threshold}
                  onChange={(_e) => setThreshold(parseInt(_e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={60}>60% - More matches</option>
                  <option value={70}>70% - Balanced</option>
                  <option value={80}>80% - Fewer matches</option>
                  <option value={90}>90% - Very strict</option>
                </select>
                <button
                  onClick={findDuplicates}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaSync className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCheck className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h4>
                <p className="text-gray-600">
                  No potential duplicate contacts were found with the current threshold.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found {duplicateGroups.length} potential duplicate groups affecting{' '}
                  {duplicateGroups.reduce((sum, group) => sum + group.contacts.length, 0)} contacts.
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' : `${group.matchType} match`}
                          </span>
                          <span className="text-sm text-gray-600">
                            {group.similarityScore}% similarity
                          </span>
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.contacts.map((contact, _index) => (
                          <div key={contact.id} className="bg-gray-50 rounded-md p-3">
                            <h4 className="font-medium text-gray-900">
                              {contact.name}
                            </h4>
                            <div className="mt-1 text-sm text-gray-600 space-y-1">
                              {contact.email && <p>Email: {contact.email}</p>}
                              {contact.phone && <p>Phone: {contact.phone}</p>}
                              {contact.address && (
                                <p>Address: {contact.address}, {contact.city}, {contact.state} {contact.zip}</p>
                              )}
                              <p>Created: {format(new Date(contact.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Merge Step */}
        {step === 'merge' && selectedGroup && primaryContact && duplicateContact && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to duplicates list
              </button>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Merge Contacts
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Contact */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-green-900">Primary Contact</h5>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    Will be kept
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {primaryContact.name}</p>
                  <p><strong>Email:</strong> {primaryContact.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {primaryContact.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {primaryContact.address || 'N/A'}</p>
                  <p><strong>Created:</strong> {format(new Date(primaryContact.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Duplicate Contact */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-red-900">Duplicate Contact</h5>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    Will be deleted
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {duplicateContact.name}</p>
                  <p><strong>Email:</strong> {duplicateContact.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {duplicateContact.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {duplicateContact.address || 'N/A'}</p>
                  <p><strong>Created:</strong> {format(new Date(duplicateContact.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Merged Result */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">Merged Contact Data</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={mergedData.name || ''}
                      onChange={(_e) => setMergedData(prev => ({ ...prev, name: _e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={mergedData.email || ''}
                      onChange={(_e) => setMergedData(prev => ({ ...prev, email: _e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={mergedData.phone || ''}
                      onChange={(_e) => setMergedData(prev => ({ ...prev, phone: _e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={mergedData.address || ''}
                      onChange={(_e) => setMergedData(prev => ({ ...prev, address: _e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={mergedData.city || ''}
                        onChange={(_e) => setMergedData(prev => ({ ...prev, city: _e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={mergedData.state || ''}
                        onChange={(_e) => setMergedData(prev => ({ ...prev, state: _e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={mergedData.zip || ''}
                      onChange={(_e) => setMergedData(prev => ({ ...prev, zip: _e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeContacts}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Merge Contacts
              </button>
            </div>
          </div>
        )}

        {/* Merging Step */}
        {step === 'merging' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Merging contacts...</p>
          </div>
        )}
      </div>
    </div>
  );
}
