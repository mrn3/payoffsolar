'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaFilePdf, FaTrash, FaDownload } from 'react-icons/fa';

interface PDFUploadProps {
  onPDFUploaded: (file: { url: string; originalName: string }) => void;
  onPDFRemoved?: () => void;
  existingPDF?: string | null;
  className?: string;
  label?: string;
}

export default function PDFUpload({
  onPDFUploaded,
  onPDFRemoved,
  existingPDF = null,
  className = '',
  label = 'Data Sheet (PDF)'
}: PDFUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0]; // Only handle single file
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      if (data.files && data.files.length > 0) {
        onPDFUploaded(data.files[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = () => {
    if (onPDFRemoved) {
      onPDFRemoved();
    }
    setError(null);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'document.pdf';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {existingPDF ? (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaFilePdf className="text-red-500 text-xl" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getFileName(existingPDF)}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={existingPDF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Download PDF"
              >
                <FaDownload />
              </a>
              {onPDFRemoved && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove PDF"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="space-y-2">
            <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">PDF files only, max 10MB</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
