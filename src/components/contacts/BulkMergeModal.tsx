'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaSync } from 'react-icons/fa';
import { Contact } from '@/lib/models';
import { format } from 'date-fns';
import PhoneInput from '@/components/ui/PhoneInput';
import StateSelect from '@/components/ui/StateSelect';

interface BulkMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactIds: string[];
  onComplete: () => void;
}

interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  matchType: string;
  similarityScore: number;
}

export default function BulkMergeModal({
  isOpen,
  onClose,
  selectedContactIds,
  onComplete
}: BulkMergeModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [duplicateContact, setDuplicateContact] = useState<Contact | null>(null);
  const [mergedData, setMergedData] = useState<Partial<Contact>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicatesInSelection();
    }
  }, [isOpen, selectedContactIds]);

  const findDuplicatesInSelection = async () => {
    setStep('loading');
    setError(null);

    try {
      // First, try to find actual duplicates
      const response = await fetch('/api/contacts/bulk-find-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectedContactIds,
          threshold: 70
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find duplicates');
      }

      const data = await response.json();
      const foundDuplicates = data.duplicateGroups || [];

      // If no duplicates found but we have selected contacts, create merge groups anyway
      if (foundDuplicates.length === 0 && selectedContactIds.length >= 2) {
        // Fetch the selected contacts to create manual merge groups
        const contactsResponse = await fetch('/api/contacts/bulk-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactIds: selectedContactIds })
        });

        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          const contacts = contactsData.contacts || [];

          if (contacts.length >= 2) {
            // Create manual merge groups from selected contacts
            const manualGroups: DuplicateGroup[] = [];
            for (let i = 0; i < contacts.length - 1; i += 2) {
              const groupContacts = contacts.slice(i, i + 2);
              if (groupContacts.length === 2) {
                manualGroups.push({
                  id: `manual-group-${i / 2 + 1}`,
                  contacts: groupContacts,
                  matchType: 'manual',
                  similarityScore: 0
                });
              }
            }

            // If there's an odd number of contacts, add the last one to the last group
            if (contacts.length % 2 === 1 && manualGroups.length > 0) {
              manualGroups[manualGroups.length - 1].contacts.push(contacts[contacts.length - 1]);
            }

            setDuplicateGroups(manualGroups);
          }
        }
      } else {
        setDuplicateGroups(foundDuplicates);
      }

      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    }
  };

  const handleMergeGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setPrimaryContact(group.contacts[0]);
    setDuplicateContact(group.contacts[1]);

    // Initialize merged data with primary contact data, but merge in non-empty values from other contacts
    const mergedContactData = { ...group.contacts[0] };

    // For each field, use the first non-empty value found across all contacts
    for (let i = 1; i < group.contacts.length; i++) {
      const contact = group.contacts[i];
      if (!mergedContactData.email && contact.email) mergedContactData.email = contact.email;
      if (!mergedContactData.phone && contact.phone) mergedContactData.phone = contact.phone;
      if (!mergedContactData.address && contact.address) mergedContactData.address = contact.address;
      if (!mergedContactData.city && contact.city) mergedContactData.city = contact.city;
      if (!mergedContactData.state && contact.state) mergedContactData.state = contact.state;
      if (!mergedContactData.zip && contact.zip) mergedContactData.zip = contact.zip;
      if (!mergedContactData.notes && contact.notes) mergedContactData.notes = contact.notes;
    }

    setMergedData({
      name: mergedContactData.name,
      email: mergedContactData.email,
      phone: mergedContactData.phone,
      address: mergedContactData.address,
      city: mergedContactData.city,
      state: mergedContactData.state,
      zip: mergedContactData.zip,
      notes: mergedContactData.notes
    });

    setStep('merge');
  };

  const handleMergeContacts = async () => {
    if (!primaryContact || !selectedGroup || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      // For groups with more than 2 contacts, merge all non-primary contacts into the primary one
      const contactsToMerge = selectedGroup.contacts.filter(contact => contact.id !== primaryContact.id);

      for (const contactToMerge of contactsToMerge) {
        const response = await fetch('/api/contacts/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryContactId: primaryContact.id,
            duplicateContactId: contactToMerge.id,
            mergedData
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to merge contacts');
        }
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));

      // Reset state
      setSelectedGroup(null);
      setPrimaryContact(null);
      setDuplicateContact(null);
      setMergedData({});
      setStep('list');

      // If no more duplicates, complete the process
      if (duplicateGroups.length <= 1) {
        onComplete();
      }
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
      case 'name':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'phone':
        return 'bg-yellow-100 text-yellow-800';
      case 'multiple':
        return 'bg-purple-100 text-purple-800';
      case 'manual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Merge Duplicates in Selection
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Finding duplicates in selected contacts...</div>
          </div>
        )}

        {step === 'list' && (
          <div>
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCopy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts to merge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Unable to create merge groups from your selection.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {duplicateGroups[0]?.matchType === 'manual'
                    ? `Ready to merge ${duplicateGroups.length} group${duplicateGroups.length !== 1 ? 's' : ''} from your selection.`
                    : `Found ${duplicateGroups.length} duplicate group${duplicateGroups.length !== 1 ? 's' : ''} in your selection.`
                  }
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' :
                             group.matchType === 'manual' ? 'Manual merge' :
                             `${group.matchType} match`}
                          </span>
                          {group.matchType !== 'manual' && (
                            <span className="text-sm text-gray-600">
                              {group.similarityScore}% similarity
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.contacts.map((contact, index) => (
                          <div key={contact.id} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">{contact.name}</h4>
                            <div className="mt-1 text-sm text-gray-600 space-y-1">
                              {contact.email && <div>Email: {contact.email}</div>}
                              {contact.phone && <div>Phone: {contact.phone}</div>}
                              {(contact.city || contact.state) && (
                                <div>Location: {[contact.city, contact.state].filter(Boolean).join(', ')}</div>
                              )}
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
                ← Back to merge list
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
                <div className="space-y-2 text-sm text-gray-900">
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
                  <h5 className="font-medium text-red-900">Contact to Merge</h5>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    Will be deleted
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-900">
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
                      onChange={(e) => setMergedData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={mergedData.email || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <PhoneInput
                      name="phone"
                      value={mergedData.phone || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={mergedData.address || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={mergedData.city || ''}
                        onChange={(e) => setMergedData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                      <StateSelect
                        name="state"
                        value={mergedData.state || ''}
                        onChange={(e) => setMergedData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={mergedData.zip || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, zip: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={mergedData.notes || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      rows={2}
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
