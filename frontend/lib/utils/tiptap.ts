export function tiptapToPlainText(json: Record<string, unknown> | null | undefined): string {
  if (!json) return ''

  function extract(node: Record<string, unknown>): string {
    if (node.type === 'text') return (node.text as string) || ''
    if (!node.content) return ''
    return (node.content as Record<string, unknown>[]).map(extract).join(' ')
  }

  return extract(json).trim()
}

export function plainTextToTiptap(text: string): Record<string, unknown> {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  }
}

export const EDITOR_FONTS = [
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Source Code Pro', value: 'Source Code Pro' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono' },
]

export const EDITOR_COLORS = [
  '#F0EDE6', '#F4A636', '#0FADA0', '#3B82F6',
  '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6B7280', '#FFFFFF', '#000000',
]
