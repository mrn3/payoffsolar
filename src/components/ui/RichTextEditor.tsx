'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaLink,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaQuoteLeft,
  FaTable,
  FaPlus,
  FaMinus
} from 'react-icons/fa';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

// Custom extension to preserve table styling when pasting
const TableStylingExtension = Extension.create({
  name: 'tableStyling',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tableStyling'),
        props: {
          transformPastedHTML(html: string) {
            // Create a temporary DOM element to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Find all table cells and preserve their styling
            const cells = tempDiv.querySelectorAll('td, th');
            cells.forEach(cell => {
              const element = cell as HTMLElement;

              // Preserve background color from style attribute
              const style = element.getAttribute('style');
              if (style && style.includes('background')) {
                // Keep the style attribute
                element.setAttribute('style', style);
              }

              // Preserve bgcolor attribute (legacy)
              const bgcolor = element.getAttribute('bgcolor');
              if (bgcolor) {
                element.setAttribute('bgcolor', bgcolor);
                // Also add to style for better compatibility
                const existingStyle = element.getAttribute('style') || '';
                element.setAttribute('style', `${existingStyle}; background-color: ${bgcolor};`);
              }

              // Preserve other common styling attributes
              ['width', 'height', 'align', 'valign'].forEach(attr => {
                const value = element.getAttribute(attr);
                if (value) {
                  element.setAttribute(attr, value);
                }
              });
            });

            return tempDiv.innerHTML;
          }
        }
      })
    ];
  }
});

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  title
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-gray-200 text-green-600' : 'text-gray-600'
    }`}
  >
    {children}
  </button>
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  className = '',
  error = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-auto border-collapse border border-gray-300',
        },
        allowTableNodeSelection: true,
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      TableStylingExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-3',
        placeholder: placeholder,
      },
      handlePaste: (view, event, slice) => {
        // Allow default paste behavior to preserve table formatting
        return false;
      },
    },
    immediatelyRender: false,
  });

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md">
        <div className="h-10 bg-gray-100 border-b border-gray-300 rounded-t-md"></div>
        <div className="h-32 bg-white rounded-b-md flex items-center justify-center">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor border rounded-md ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-md">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <FaBold />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <FaItalic />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <FaStrikethrough />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <FaListUl />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <FaListOl />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <FaLink />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <FaAlignLeft />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <FaAlignCenter />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <FaAlignRight />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <FaQuoteLeft />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          isActive={false}
          title="Insert Table"
        >
          <FaTable />
        </ToolbarButton>

        {editor.isActive('table') && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              isActive={false}
              title="Add Row Above"
            >
              <FaPlus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              isActive={false}
              title="Add Row Below"
            >
              <FaPlus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              isActive={false}
              title="Delete Row"
            >
              <FaMinus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              isActive={false}
              title="Add Column Before"
            >
              <FaPlus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              isActive={false}
              title="Add Column After"
            >
              <FaPlus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              isActive={false}
              title="Delete Column"
            >
              <FaMinus />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              isActive={false}
              title="Delete Table"
            >
              <FaMinus />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="bg-white rounded-b-md">
        <EditorContent
          editor={editor}
          className="min-h-[120px] text-gray-900"
        />
      </div>

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          padding: 12px;
          min-height: 120px;
          color: #111827;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          color: #111827;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #111827;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #111827;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5rem 0;
          color: #111827;
        }
        .rich-text-editor .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          table-layout: fixed;
          width: 100%;
        }
        .rich-text-editor .ProseMirror table td,
        .rich-text-editor .ProseMirror table th {
          border: 1px solid #d1d5db;
          box-sizing: border-box;
          min-width: 1em;
          padding: 8px;
          position: relative;
          vertical-align: top;
        }
        .rich-text-editor .ProseMirror table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .rich-text-editor .ProseMirror table .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .rich-text-editor .ProseMirror table .column-resize-handle {
          background-color: #adf;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }
        .rich-text-editor .ProseMirror table p {
          margin: 0;
        }
        /* Preserve background colors and other inline styles */
        .rich-text-editor .ProseMirror table td[style],
        .rich-text-editor .ProseMirror table th[style] {
          /* Allow inline styles to override defaults */
        }
        .rich-text-editor .ProseMirror table td[bgcolor],
        .rich-text-editor .ProseMirror table th[bgcolor] {
          /* Support legacy bgcolor attribute */
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .rich-text-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror strong {
          font-weight: 700;
        }
        .rich-text-editor .ProseMirror em {
          font-style: italic;
        }
        .rich-text-editor .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
