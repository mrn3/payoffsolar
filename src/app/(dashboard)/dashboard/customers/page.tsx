'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { Customer } from '@/lib/models';
import CustomerModal from '@/components/customers/CustomerModal';
import DeleteCustomerModal from '@/components/customers/DeleteCustomerModal';
import { format } from 'date-fns';

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search })
      });

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data: CustomersResponse = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      await fetchCustomers(currentPage, searchQuery);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    }
  };



  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      await fetchCustomers(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  };

  const navigateToEdit = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}/edit`);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all customers in your account including their name, email, and other details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add customer
          </button>
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
            placeholder="Search customers by name, email, or phone"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Customers table */}
      <div className="mt-8 flex flex-col">
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
                        Loading customers...
                      </td>
                    </tr>
                  ) : customers.length > 0 ? (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {customer.first_name} {customer.last_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.city}, {customer.state}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(customer.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => navigateToEdit(customer)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit customer"
                            >
                              <FaEdit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(customer)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete customer"
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
                        {searchQuery ? 'No customers found matching your search.' : 'No customers found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
              onClick={() => fetchCustomers(currentPage - 1, searchQuery)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => fetchCustomers(currentPage + 1, searchQuery)}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCustomer}
        title="Add New Customer"
      />

      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteCustomer}
        customer={selectedCustomer}
      />
    </div>
  );
}
