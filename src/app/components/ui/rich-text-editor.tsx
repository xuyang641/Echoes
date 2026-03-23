import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, ImageIcon, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { haptics } from '../../utils/haptics';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
      haptics.light();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    haptics.light();
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children 
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={() => {
        onClick();
        haptics.light();
      }}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors flex items-center justify-center
        ${isActive 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

      <ToolbarButton onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}>
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      <div className="flex-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4 shadow-sm',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline hover:text-blue-600 transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('form.captionPlaceholder', '记录此刻...'),
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false, // Fix SSR / hydration mismatch issues and React node removal issues
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-blue max-w-none focus:outline-none min-h-[150px] p-4 text-gray-700 dark:text-gray-300',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
      <MenuBar editor={editor} />
      {/* Wrap EditorContent in a div to prevent React from losing track of the root node */}
      <div>
        <EditorContent editor={editor} className="cursor-text" />
      </div>
      
      <style>{`
        /* Placeholder specific styles */
        .is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .dark .is-editor-empty:first-child::before {
          color: #6b7280;
        }
        /* TipTap basic typography overrides to match our design */
        .ProseMirror p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.6;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #111827;
        }
        .dark .ProseMirror h2 {
          color: #f3f4f6;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #3b82f6;
          padding-left: 1rem;
          font-style: italic;
          color: #4b5563;
          margin-left: 0;
        }
        .dark .ProseMirror blockquote {
          color: #9ca3af;
          border-left-color: #60a5fa;
        }
      `}</style>
    </div>
  );
}
