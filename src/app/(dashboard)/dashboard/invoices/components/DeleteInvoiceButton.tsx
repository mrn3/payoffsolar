'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';

interface DeleteInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export default function DeleteInvoiceButton({ invoiceId, invoiceNumber }: DeleteInvoiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900 text-xs px-2 py-1 bg-red-50 rounded"
          title={`Confirm delete ${invoiceNumber}`}
        >
          {isDeleting ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 bg-gray-50 rounded"
          title="Cancel"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
      title={`Delete ${invoiceNumber}`}
    >
      <FaTrash className="h-4 w-4" />
    </button>
  );
}
