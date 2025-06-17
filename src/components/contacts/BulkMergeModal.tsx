'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy } from 'react-icons/fa';
import { Contact } from '@/lib/models';

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
      setDuplicateGroups(data.duplicateGroups || []);
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
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryContactId: primaryContact.id,
          duplicateContactId: duplicateContact.id,
          mergedData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No duplicate contacts were found in your selection.
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
                  Found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} in your selection.
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

        {/* Merge step would go here - similar to DuplicateContactsModal */}
        {step === 'merge' && selectedGroup && primaryContact && duplicateContact && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Choose which contact to keep as primary and review the merged data:
            </p>
            {/* Merge interface similar to DuplicateContactsModal */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleMergeContacts}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Merging...' : 'Merge Contacts'}
              </button>
            </div>
          </div>
        )}

        {step === 'merging' && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Merging contacts...</div>
          </div>
        )}
      </div>
    </div>
  );
}
