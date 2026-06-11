'use client'

import type { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils/cn'
import { EDITOR_FONTS, EDITOR_COLORS } from '@/lib/utils/tiptap'
import { VoiceInputButton } from './VoiceInputButton'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Heading3, Highlighter, RemoveFormatting
} from 'lucide-react'
import { useState } from 'react'

interface ToolbarProps {
  editor: Editor
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]'
      )}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const [showColors, setShowColors] = useState(false)

  const handleVoiceTranscript = (text: string) => {
    editor.commands.insertContent(text + ' ')
  }

  return (
    <div className="flex items-center gap-1 flex-wrap px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      {/* Font family */}
      <select
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded px-2 py-1 h-7 focus:outline-none focus:border-[var(--color-border-focus)]"
        defaultValue="DM Sans"
      >
        {EDITOR_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <Underline size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      {/* Color picker */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            setShowColors((v) => !v)
          }}
          title="Text color"
          className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <span className="text-xs font-mono" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }}>
            A
          </span>
        </button>
        {showColors && (
          <div className="absolute top-full left-0 z-50 mt-1 p-2 rounded-lg card grid grid-cols-6 gap-1 w-36">
            {EDITOR_COLORS.map((color) => (
              <button
                key={color}
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().setColor(color).run()
                  setShowColors(false)
                }}
                className="w-5 h-5 rounded border border-[var(--color-border)] hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(244,166,54,0.25)' }).run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear formatting"
      >
        <RemoveFormatting size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      {/* Voice input */}
      <VoiceInputButton onTranscript={handleVoiceTranscript} />
    </div>
  )
}
