'use client';

import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCopy, FaTimes } from 'react-icons/fa';
import BulkUpdateModal from './BulkUpdateModal';
import BulkDeleteModal from './BulkDeleteModal';
import BulkMergeModal from './BulkMergeModal';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedContactIds: string[];
  onClearSelection: () => void;
  onBulkComplete: () => void;
}

export default function BulkActionsToolbar({
  selectedCount,
  selectedContactIds,
  onClearSelection,
  onBulkComplete
}: BulkActionsToolbarProps) {
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkMergeModalOpen, setIsBulkMergeModalOpen] = useState(false);

  const handleBulkComplete = () => {
    onBulkComplete();
    setIsBulkUpdateModalOpen(false);
    setIsBulkDeleteModalOpen(false);
    setIsBulkMergeModalOpen(false);
  };

  return (
    <>
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsBulkUpdateModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="mr-1 h-3 w-3" />
                Update Fields
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTrash className="mr-1 h-3 w-3" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setIsBulkMergeModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaCopy className="mr-1 h-3 w-3" />
                Merge Duplicates
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FaTimes className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <BulkUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        selectedContactIds={selectedContactIds}
        onComplete={handleBulkComplete}
      />

      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedContactIds={selectedContactIds}
        selectedCount={selectedCount}
        onComplete={handleBulkComplete}
      />

      <BulkMergeModal
        isOpen={isBulkMergeModalOpen}
        onClose={() => setIsBulkMergeModalOpen(false)}
        selectedContactIds={selectedContactIds}
        onComplete={handleBulkComplete}
      />
    </>
  );
}
