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
  FaMinus,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaPalette
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

              // Get computed styles from the element
              const computedStyle = window.getComputedStyle ? null : null;

              // Preserve background color from style attribute
              const style = element.getAttribute('style');
              let backgroundColor = '';

              // Extract background color from various sources
              if (style) {
                const bgColorMatch = style.match(/background-color\s*:\s*([^;]+)/i);
                const bgMatch = style.match(/background\s*:\s*([^;]+)/i);
                if (bgColorMatch) {
                  backgroundColor = bgColorMatch[1].trim();
                } else if (bgMatch && !bgMatch[1].includes('url(')) {
                  backgroundColor = bgMatch[1].trim();
                }
              }

              // Preserve bgcolor attribute (legacy)
              const bgcolor = element.getAttribute('bgcolor');
              if (bgcolor && !backgroundColor) {
                backgroundColor = bgcolor;
              }

              // Check for CSS classes that might indicate background colors
              const className = element.getAttribute('class');
              if (className) {
                // Handle common color classes
                const colorClasses = className.split(' ').filter(cls =>
                  cls.includes('bg-') || cls.includes('background') || cls.includes('color')
                );
                if (colorClasses.length > 0) {
                  element.setAttribute('class', className);
                }
              }

              // Set the final background color
              if (backgroundColor) {
                const cleanStyle = style ? style.replace(/background[^;]*;?/gi, '').trim() : '';
                const newStyle = cleanStyle ?
                  `${cleanStyle}; background-color: ${backgroundColor}` :
                  `background-color: ${backgroundColor}`;
                element.setAttribute('style', newStyle);
                element.setAttribute('bgcolor', backgroundColor);
              }

              // Preserve other common styling attributes
              ['width', 'height', 'align', 'valign', 'colspan', 'rowspan'].forEach(attr => {
                const value = element.getAttribute(attr);
                if (value) {
                  element.setAttribute(attr, value);
                }
              });
            });

            return tempDiv.innerHTML;
          },

          // Also handle paste events directly
          handlePaste: (view, event, slice) => {
            // Let the default paste handler work, but ensure our transform is applied
            return false;
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
  title,
  className = ''
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-gray-200 text-green-600' : 'text-gray-600'
    } ${className}`}
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
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
            bgcolor: {
              default: null,
              parseHTML: element => element.getAttribute('bgcolor'),
              renderHTML: attributes => {
                if (!attributes.bgcolor) {
                  return {};
                }
                return {
                  bgcolor: attributes.bgcolor,
                };
              },
            },
          };
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
        allowGapCursor: false,
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
            bgcolor: {
              default: null,
              parseHTML: element => element.getAttribute('bgcolor'),
              renderHTML: attributes => {
                if (!attributes.bgcolor) {
                  return {};
                }
                return {
                  bgcolor: attributes.bgcolor,
                };
              },
            },
          };
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
        class: 'prose prose-sm mx-auto focus:outline-none min-h-[120px] p-3',
        placeholder: placeholder,
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

  const setCellBackgroundColor = useCallback((color: string) => {
    if (editor) {
      // Get the current selection
      const { selection } = editor.state;
      const { $from } = selection;

      // Find the table cell node
      const cellPos = $from.pos;
      const resolvedPos = editor.state.doc.resolve(cellPos);

      // Find the cell node by traversing up the tree
      let cellNode = null;
      let cellNodePos = null;

      for (let depth = resolvedPos.depth; depth > 0; depth--) {
        const node = resolvedPos.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cellNode = node;
          cellNodePos = resolvedPos.before(depth);
          break;
        }
      }

      if (cellNode && cellNodePos !== null) {
        // Update the cell's attributes
        const tr = editor.state.tr;
        const newAttrs = {
          ...cellNode.attrs,
          style: color === 'transparent' ? null : `background-color: ${color}`,
          bgcolor: color === 'transparent' ? null : color
        };

        tr.setNodeMarkup(cellNodePos, null, newAttrs);
        editor.view.dispatch(tr);
      }
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
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
              <span className="text-xs font-medium text-blue-700 mr-2">Table:</span>

              <ToolbarButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                isActive={false}
                title="Add Row Above"
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <FaArrowUp className="text-xs" />
                  <span className="text-xs">Row</span>
                </div>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                isActive={false}
                title="Add Row Below"
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <FaArrowDown className="text-xs" />
                  <span className="text-xs">Row</span>
                </div>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                isActive={false}
                title="Add Column Before"
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <FaArrowLeft className="text-xs" />
                  <span className="text-xs">Col</span>
                </div>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                isActive={false}
                title="Add Column After"
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <FaArrowRight className="text-xs" />
                  <span className="text-xs">Col</span>
                </div>
              </ToolbarButton>

              <div className="w-px h-4 bg-blue-300 mx-1" />

              <div className="flex items-center gap-1">
                <FaPalette className="text-xs text-blue-700" />
                <input
                  type="color"
                  onChange={(e) => setCellBackgroundColor(e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                  title="Cell Background Color"
                />
                <button
                  onClick={() => setCellBackgroundColor('transparent')}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-600"
                  title="Remove Background Color"
                >
                  Clear
                </button>
              </div>

              <div className="w-px h-4 bg-blue-300 mx-1" />

              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                isActive={false}
                title="Delete Current Row"
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center gap-1">
                  <FaTrash className="text-xs" />
                  <span className="text-xs">Row</span>
                </div>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                isActive={false}
                title="Delete Current Column"
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center gap-1">
                  <FaTrash className="text-xs" />
                  <span className="text-xs">Col</span>
                </div>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                isActive={false}
                title="Delete Entire Table"
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center gap-1">
                  <FaTrash className="text-xs" />
                  <span className="text-xs">Table</span>
                </div>
              </ToolbarButton>
            </div>
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
          font-size: 14px;
          line-height: 1.5;
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
