'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Image } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { EditorToolbar } from './EditorToolbar'
import { useEffect, useRef } from 'react'

interface RichTextEditorProps {
  content: Record<string, unknown> | null | undefined
  placeholder?: string
  onChange?: (json: Record<string, unknown>) => void
  readOnly?: boolean
}

export function RichTextEditor({ content, placeholder, onChange, readOnly }: RichTextEditorProps) {
  // Track whether the last content change came from user typing (internal)
  // so we don't reset the editor while the user is mid-sentence
  const isInternalChange = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
      CharacterCount,
      Image,
      Underline,
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      isInternalChange.current = true
      onChange?.(editor.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[200px] focus:outline-none',
      },
    },
  })

  // Only sync content from outside when it's NOT caused by the user typing
  // (e.g. switching tabs/entries loads new content)
  useEffect(() => {
    if (!editor) return
    if (isInternalChange.current) {
      // This update came from user typing — don't reset the editor
      isInternalChange.current = false
      return
    }
    // External content change (e.g. switching to a different entry)
    const incoming = JSON.stringify(content || '')
    const current = JSON.stringify(editor.getJSON())
    if (incoming !== current) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
      {!readOnly && (
        <div className="px-4 pb-2 text-xs text-[var(--color-text-disabled)] text-right">
          {editor.storage.characterCount?.words()} words
        </div>
      )}
    </div>
  )
}
