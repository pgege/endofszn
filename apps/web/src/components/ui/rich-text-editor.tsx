import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({ 
  onClick, 
  active, 
  title, 
  children 
}: { 
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  )
}

export function RichTextPreview({ 
  content, 
  className,
  collapsed = false,
  maxLines = 3,
}: { 
  content: string
  className?: string
  collapsed?: boolean
  maxLines?: number
}) {
  if (!content || content === '<p></p>') return null

  return (
    <div 
      className={cn(
        "rich-text-content text-sm",
        collapsed && "line-clamp-3",
        className
      )}
      style={collapsed ? { WebkitLineClamp: maxLines } : undefined}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

const editorStyles = `
  .rich-text-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  .rich-text-content h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .rich-text-content p {
    margin-bottom: 0.5rem;
  }
  .rich-text-content ul, .rich-text-content ol {
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .rich-text-content ul {
    list-style-type: disc;
  }
  .rich-text-content ol {
    list-style-type: decimal;
  }
  .rich-text-content li {
    margin-bottom: 0.25rem;
  }
  .rich-text-content strong {
    font-weight: 600;
  }
  .rich-text-content em {
    font-style: italic;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`

if (typeof document !== 'undefined') {
  const styleId = 'rich-text-editor-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = editorStyles
    document.head.appendChild(style)
  }
}
