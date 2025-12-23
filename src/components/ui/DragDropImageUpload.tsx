'use client';

import React, { useState, useRef } from 'react';
import { FaImage, FaSpinner, FaTrash, FaUpload, FaGripVertical } from 'react-icons/fa';
import { resizeImages } from '@/lib/utils/imageResize';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProductImage } from '@/lib/types';

interface UploadedImage {
  originalName: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

interface DragDropImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  onImageRemoved?: (imageUrl: string) => void;
  onImageReordered?: (reorderedImages: ProductImage[]) => void;
  existingImages?: ProductImage[];
  maxImages?: number;
  className?: string;
  productId?: string;
}

interface SortableImageItemProps {
  image: ProductImage;
  index: number;
  onRemove: (imageUrl: string) => void;
}

function SortableImageItem({ image, index, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white border border-gray-200 rounded-lg overflow-hidden ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-white bg-opacity-80 rounded p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <FaGripVertical className="h-3 w-3 text-gray-600" />
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100">
        <img
          src={image.image_url}
          alt={image.alt_text || `Product image ${index + 1}`}
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

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(image.image_url)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <FaTrash className="h-3 w-3" />
      </button>

      {/* Order Number */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>
    </div>
  );
}

export default function DragDropImageUpload({
	onImagesUploaded,
	onImageRemoved,
	onImageReordered,
	existingImages = [],
	maxImages = 30,
	className = '',
	productId
}: DragDropImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      // Resize images before uploading
      const resizedFiles = await resizeImages(Array.from(files), {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
      });

      // Add resized files to form data
      resizedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = existingImages.findIndex(img => img.id === active.id);
      const newIndex = existingImages.findIndex(img => img.id === over?.id);

      const reorderedImages = arrayMove(existingImages, oldIndex, newIndex);
      
      // Update sort orders
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        sort_order: index
      }));

      // Call the reorder callback immediately for UI update
      if (onImageReordered) {
        onImageReordered(updatedImages);
      }

      // Save to backend if productId is provided
      if (productId) {
        setReordering(true);
        try {
          const imageOrders = updatedImages.map((img, index) => ({
            imageId: img.id,
            sortOrder: index
          }));

          const response = await fetch(`/api/products/${productId}/images`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageOrders })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update image order');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update image order');
        } finally {
          setReordering(false);
        }
      }
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
            <p className="text-sm text-gray-600">Resizing and uploading images...</p>
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
              <br />
              Images will be automatically resized for web
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

      {/* Reordering Status */}
      {reordering && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded p-2 flex items-center">
          <FaSpinner className="h-4 w-4 animate-spin mr-2" />
          Updating image order...
        </div>
      )}

      {/* Existing Images with Drag and Drop */}
      {existingImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Current Images {existingImages.length > 1 && '(drag to reorder)'}
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={existingImages.map(img => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    onRemove={handleRemoveImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Image Count */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {existingImages.length} / {maxImages} images
      </div>
    </div>
  );
}
