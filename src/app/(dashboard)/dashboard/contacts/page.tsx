'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {FaCopy, FaEdit, FaPlus, FaSearch, FaTrash, FaTrashAlt, FaUpload} from 'react-icons/fa';
import { format } from 'date-fns';
import { Contact } from '@/lib/models';
import DeleteContactModal from '@/components/contacts/DeleteContactModal';
import DeleteAllContactsModal from '@/components/contacts/DeleteAllContactsModal';
import ImportContactsModal from '@/components/contacts/ImportContactsModal';
import DuplicateContactsModal from '@/components/contacts/DuplicateContactsModal';

interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchContacts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search })
      });

      const _response = await fetch(`/api/contacts?${params}`);
      if (!_response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const _data: ContactsResponse = await _response.json();
      setContacts(_data.contacts);
      setPagination(_data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(_e.target.value);
    setCurrentPage(1);
  };

  const navigateToAdd = () => {
    router.push('/dashboard/contacts/new');
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      const _response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'DELETE'
      });

      if (!_response.ok) {
        const errorData = await _response.json();
        throw new Error(errorData.error || 'Failed to delete contact');
      }

      await fetchContacts(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (err) {
      console.error('Error deleting contact:', err);
      throw err;
    }
  };

  const handleDeleteAllContacts = async () => {
    try {
      const _response = await fetch('/api/contacts/bulk-delete', {
        method: 'DELETE'
      });

      if (!_response.ok) {
        const errorData = await _response.json();
        throw new Error(errorData.error || 'Failed to delete all contacts');
      }

      await fetchContacts(1, '');
      setSearchQuery('');
      setCurrentPage(1);
      setIsDeleteAllModalOpen(false);
    } catch (err) {
      console.error('Error deleting all _contacts:', err);
      throw err;
    }
  };

  const navigateToEdit = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}/edit`);
  };

  const openDeleteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const handleImportComplete = () => {
    fetchContacts(1, searchQuery);
  };

  const handleDuplicatesComplete = () => {
    fetchContacts(currentPage, searchQuery);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all contacts in your account including their name, email, and other details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsDuplicatesModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaCopy className="mr-2 h-4 w-4" />
              Find Duplicates
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaUpload className="mr-2 h-4 w-4" />
              Import CSV
            </button>
            {pagination.total > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaTrashAlt className="mr-2 h-4 w-4" />
                Delete All
              </button>
            )}
            <button
              type="button"
              onClick={navigateToAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add contact
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6 flex flex-col sm:flex-row">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search contacts by name, email, or phone"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Contacts table - Desktop */}
      <div className="mt-8 hidden sm:flex sm:flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading contacts...
                      </td>
                    </tr>
                  ) : contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {contact.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {contact.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {contact.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {[contact.city, contact.state].filter(Boolean).join(', ')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(contact.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => navigateToEdit(contact)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit contact"
                            >
                              <FaEdit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(contact)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete contact"
                            >
                              <FaTrash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchQuery ? 'No contacts found matching your search.' : 'No contacts found.' }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts cards - Mobile */}
      <div className="mt-8 sm:hidden">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Loading contacts...</p>
          </div>
        ) : contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {contact.name}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {contact.email && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">Email:</span> {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {contact.phone}
                        </p>
                      )}
                      {(contact.city || contact.state) && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {[contact.city, contact.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {format(new Date(contact.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      type="button"
                      onClick={() => navigateToEdit(contact)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                      title="Edit contact"
                    >
                      <FaEdit className="h-5 w-5" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(contact)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete contact"
                    >
                      <FaTrash className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No contacts found matching your search.' : 'No contacts found.' }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchContacts(currentPage - 1, searchQuery)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => fetchContacts(currentPage + 1, searchQuery)}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteContactModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedContact(null);
        }}
        onConfirm={handleDeleteContact}
        contact={selectedContact}
      />

      <DeleteAllContactsModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllContacts}
        contactCount={pagination.total}
      />

      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <DuplicateContactsModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
        onMergeComplete={handleDuplicatesComplete}
      />
    </div>
  );
}
