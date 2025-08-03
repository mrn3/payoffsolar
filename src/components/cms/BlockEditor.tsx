'use client';

import React, { useState, useEffect } from 'react';
import { BlockType, ContentBlockWithType } from '@/lib/models';
import { FaPlus, FaGripVertical, FaEdit, FaTrash, FaImage, FaThLarge, FaAlignLeft, FaVideo } from 'react-icons/fa';
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

interface BlockEditorProps {
  contentId?: string;
  blocks: ContentBlockWithType[];
  onBlocksChange: (blocks: ContentBlockWithType[]) => void;
  className?: string;
}

interface SortableBlockItemProps {
  block: ContentBlockWithType;
  onEdit: (block: ContentBlockWithType) => void;
  onDelete: (blockId: string) => void;
}

function SortableBlockItem({ block, onEdit, onDelete }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockIcon = (blockType: string) => {
    switch (blockType) {
      case 'hero': return <FaImage className="h-4 w-4" />;
      case 'card_grid': return <FaThLarge className="h-4 w-4" />;
      case 'text_block': return <FaAlignLeft className="h-4 w-4" />;
      case 'image_block': return <FaImage className="h-4 w-4" />;
      case 'video_block': return <FaVideo className="h-4 w-4" />;
      default: return <FaAlignLeft className="h-4 w-4" />;
    }
  };

  const getBlockTitle = (block: ContentBlockWithType) => {
    const config = block.configuration;
    if (config?.title) return config.title;
    if (config?.content) return config.content.substring(0, 50) + '...';
    return block.block_type_display_name || 'Untitled Block';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <FaGripVertical className="h-4 w-4" />
          </div>
          <div className="flex items-center space-x-2">
            {getBlockIcon(block.block_type_name || '')}
            <span className="font-medium text-gray-900">
              {getBlockTitle(block)}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onEdit(block)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit block"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete block"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlockEditor({ contentId, blocks, onBlocksChange, className = '' }: BlockEditorProps) {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlockWithType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBlockTypes();
  }, []);

  const fetchBlockTypes = async () => {
    try {
      const response = await fetch('/api/block-types');
      if (response.ok) {
        const data = await response.json();
        setBlockTypes(data.blockTypes);
      }
    } catch (error) {
      console.error('Error fetching block types:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        block_order: index
      }));
      
      onBlocksChange(newBlocks);
    }
  };

  const handleAddBlock = (blockType: BlockType) => {
    const newBlock: ContentBlockWithType = {
      id: `temp-${Date.now()}`, // Temporary ID
      content_id: contentId || '',
      block_type_id: blockType.id,
      block_type_name: blockType.name,
      block_type_display_name: blockType.display_name,
      block_type_icon: blockType.icon,
      block_order: blocks.length,
      configuration: getDefaultConfiguration(blockType.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onBlocksChange([...blocks, newBlock]);
    setShowAddMenu(false);
    setEditingBlock(newBlock);
  };

  const getDefaultConfiguration = (blockTypeName: string) => {
    switch (blockTypeName) {
      case 'hero':
        return { title: 'Hero Title', subtitle: '', textAlign: 'center' };
      case 'card_grid':
        return { title: '', subtitle: '', columns: 3, cards: [] };
      case 'text_block':
        return { content: '<p>Enter your text here...</p>', textAlign: 'left' };
      case 'image_block':
        return { image: '', caption: '', alt: '', size: 'medium' };
      case 'video_block':
        return { url: '', title: '', description: '', autoplay: false };
      default:
        return {};
    }
  };

  const handleEditBlock = (block: ContentBlockWithType) => {
    setEditingBlock(block);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this block?')) {
      const newBlocks = blocks.filter(block => block.id !== blockId)
        .map((block, index) => ({ ...block, block_order: index }));
      onBlocksChange(newBlocks);
    }
  };

  const handleSaveBlock = (updatedBlock: ContentBlockWithType) => {
    const newBlocks = blocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    onBlocksChange(newBlocks);
    setEditingBlock(null);
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Content Blocks</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Block
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                {blockTypes.map((blockType) => (
                  <button
                    key={blockType.id}
                    type="button"
                    onClick={() => handleAddBlock(blockType)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="mr-3">
                      {blockType.icon === 'FaImage' && <FaImage className="h-4 w-4" />}
                      {blockType.icon === 'FaThLarge' && <FaThLarge className="h-4 w-4" />}
                      {blockType.icon === 'FaAlignLeft' && <FaAlignLeft className="h-4 w-4" />}
                      {blockType.icon === 'FaVideo' && <FaVideo className="h-4 w-4" />}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">{blockType.display_name}</div>
                      <div className="text-xs text-gray-500">{blockType.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No blocks added yet. Click "Add Block" to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map(block => block.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block) => (
              <SortableBlockItem
                key={block.id}
                block={block}
                onEdit={handleEditBlock}
                onDelete={handleDeleteBlock}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      </div>

      {/* Block Configuration Modal */}
      {editingBlock && (
        <BlockConfigModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onCancel={() => setEditingBlock(null)}
        />
      )}
    </>
  );
}

// Block Configuration Modal Component
interface BlockConfigModalProps {
  block: ContentBlockWithType;
  onSave: (block: ContentBlockWithType) => void;
  onCancel: () => void;
}

function BlockConfigModal({ block, onSave, onCancel }: BlockConfigModalProps) {
  const [config, setConfig] = useState(block.configuration);

  const handleSave = () => {
    onSave({
      ...block,
      configuration: config,
      updated_at: new Date().toISOString()
    });
  };

  const renderConfigForm = () => {
    switch (block.block_type_name) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={config.subtitle || ''}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
              <input
                type="url"
                value={config.backgroundImage || ''}
                onChange={(e) => setConfig({ ...config, backgroundImage: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
              <select
                value={config.textAlign || 'center'}
                onChange={(e) => setConfig({ ...config, textAlign: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );

      case 'card_grid':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={config.subtitle || ''}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
              <select
                value={config.columns || 3}
                onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cards</label>
              <CardGridEditor
                cards={config.cards || []}
                onChange={(cards) => setConfig({ ...config, cards })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            Configuration form for {block.block_type_display_name} is not implemented yet.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Configure {block.block_type_display_name}
          </h3>
        </div>

        <div className="px-6 py-4">
          {renderConfigForm()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Card Grid Editor Component
interface CardGridEditorProps {
  cards: any[];
  onChange: (cards: any[]) => void;
}

function CardGridEditor({ cards, onChange }: CardGridEditorProps) {
  const addCard = () => {
    onChange([...cards, { title: '', description: '', image: '', link: '', linkText: '' }]);
  };

  const updateCard = (index: number, field: string, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    onChange(newCards);
  };

  const removeCard = (index: number) => {
    onChange(cards.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <div key={index} className="border border-gray-200 rounded-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">Card {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeCard(index)}
              className="text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              placeholder="Card title"
              value={card.title || ''}
              onChange={(e) => updateCard(index, 'title', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              placeholder="Card description"
              value={card.description || ''}
              onChange={(e) => updateCard(index, 'description', e.target.value)}
              rows={2}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="url"
              placeholder="Image URL"
              value={card.image || ''}
              onChange={(e) => updateCard(index, 'image', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="url"
              placeholder="Link URL"
              value={card.link || ''}
              onChange={(e) => updateCard(index, 'link', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Link text"
              value={card.linkText || ''}
              onChange={(e) => updateCard(index, 'linkText', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addCard}
        className="w-full border-2 border-dashed border-gray-300 rounded-md py-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaPlus className="h-4 w-4 mx-auto mb-1" />
        Add Card
      </button>
    </div>
  );
}
