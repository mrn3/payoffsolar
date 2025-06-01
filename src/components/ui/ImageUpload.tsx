'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaTrash, FaImage, FaSpinner } from 'react-icons/fa';

interface UploadedImage {
  originalName: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  onImageRemoved?: (imageUrl: string) => void;
  existingImages?: string[];
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({
  onImagesUploaded,
  onImageRemoved,
  existingImages = [],
  maxImages = 10,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const totalImages = existingImages.length + files.length;
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can upload ${maxImages - existingImages.length} more.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onImagesUploaded(data.files);
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

  const handleRemoveImage = (imageUrl: string) => {
    if (onImageRemoved) {
      onImageRemoved(imageUrl);
    }
  };

  return (
    <div className={className}>
      {/* Upload Area */}
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
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="h-8 w-8 text-green-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaUpload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-green-600 cursor-pointer hover:text-green-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP up to 5MB each (max {maxImages} images)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Existing Images Preview */}
      {existingImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center bg-gray-100">
                    <FaImage className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                {onImageRemoved && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Count */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {existingImages.length} / {maxImages} images
      </div>
    </div>
  );
}
