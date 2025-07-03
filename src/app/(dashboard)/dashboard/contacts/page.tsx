'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {FaCopy, FaEdit, FaEye, FaPlus, FaSearch, FaTrash, FaTrashAlt, FaUpload} from 'react-icons/fa';
import { format } from 'date-fns';
import { Contact } from '@/lib/models';
import DeleteContactModal from '@/components/contacts/DeleteContactModal';
import DeleteAllContactsModal from '@/components/contacts/DeleteAllContactsModal';
import ImportContactsModal from '@/components/contacts/ImportContactsModal';
import DuplicateContactsModal from '@/components/contacts/DuplicateContactsModal';
import BulkActionsToolbar from '@/components/contacts/BulkActionsToolbar';

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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Bulk selection state
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  const fetchContacts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      });

      const _response = await fetch(`/api/contacts?${params}`);
      if (!_response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const _data: ContactsResponse = await _response.json();
      setContacts(_data.contacts);
      setPagination(_data.pagination);
      setCurrentPage(_data.pagination.page);
      setTotalPages(_data.pagination.totalPages);
      setTotal(_data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  useEffect(() => {
    fetchContacts(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(_e.target.value);
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
      setLocalSearchQuery('');
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

  // Bulk selection functions
  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContactIds);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContactIds(newSelected);

    // Update select all checkbox state
    setIsSelectAllChecked(newSelected.size === contacts.length && contacts.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(contacts.map(contact => contact.id));
      setSelectedContactIds(allIds);
    } else {
      setSelectedContactIds(new Set());
    }
    setIsSelectAllChecked(checked);
  };

  const clearSelection = () => {
    setSelectedContactIds(new Set());
    setIsSelectAllChecked(false);
  };

  // Clear selection when contacts change (e.g., after pagination)
  useEffect(() => {
    clearSelection();
  }, [contacts]);

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
            value={localSearchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search contacts by name, email, phone, or notes"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedContactIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedContactIds.size}
          selectedContactIds={Array.from(selectedContactIds)}
          onClearSelection={clearSelection}
          onBulkComplete={() => {
            clearSelection();
            fetchContacts(currentPage, searchQuery);
          }}
        />
      )}

      {/* Contacts table - Desktop */}
      <div className="mt-8 hidden sm:flex sm:flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        checked={isSelectAllChecked}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 sm:left-6"
                      />
                    </th>
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
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading contacts...
                      </td>
                    </tr>
                  ) : contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                          <input
                            type="checkbox"
                            checked={selectedContactIds.has(contact.id)}
                            onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 sm:left-6"
                          />
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                            className="text-green-600 hover:text-green-900 hover:underline font-medium"
                          >
                            {contact.name}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {contact.email}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {contact.phone ? (
                            <a
                              href={`sms:${contact.phone}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {contact.phone}
                            </a>
                          ) : (
                            '-'
                          )}
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
                              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                              className="text-green-600 hover:text-green-900"
                              title="View contact"
                            >
                              <FaEye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </button>
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
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
            {/* Mobile Select All */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSelectAllChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Select all contacts
                </span>
              </label>
            </div>
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(contact.id)}
                      onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                        className="text-green-600 hover:text-green-900 hover:underline font-medium"
                      >
                        {contact.name}
                      </button>
                    </h3>
                    <div className="mt-2 space-y-1">
                      {contact.email && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">Email:</span>{' '}
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span>{' '}
                          <a
                            href={`sms:${contact.phone}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {contact.phone}
                          </a>
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
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                      className="text-green-600 hover:text-green-900 p-2"
                      title="View contact"
                    >
                      <FaEye className="h-5 w-5" />
                      <span className="sr-only">View</span>
                    </button>
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
      {!loading && contacts.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => currentPage > 1 && fetchContacts(currentPage - 1, searchQuery)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => currentPage < totalPages && fetchContacts(currentPage + 1, searchQuery)}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => currentPage > 1 && fetchContacts(currentPage - 1, searchQuery)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchContacts(page, searchQuery)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => currentPage < totalPages && fetchContacts(currentPage + 1, searchQuery)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
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
