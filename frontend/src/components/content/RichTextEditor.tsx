import { useRef, useState } from 'react'
import { RichText } from './RichText'
import { mediaApi } from '../../api/endpoints'
import { 
  Bold, Italic, Code, FileCode, Heading2, 
  Quote, List, ListOrdered, Link, Image as ImageIcon, 
  Eye, Edit3, Loader2 
} from 'lucide-react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

/**
 * Markdown editor with a formatting toolbar, live preview and image
 * uploads. Markdown keeps technical content (code blocks especially)
 * precise and is sanitised on render.
 */
export function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }: EditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const surround = (before: string, after = before, placeholderText = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || placeholderText
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const prependLine = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    onChange(`${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`)
  }

  const uploadImage = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const media = await mediaApi.upload(file)
      const el = textareaRef.current
      const at = el ? el.selectionStart : value.length
      onChange(`${value.slice(0, at)}\n![${file.name}](${media.url})\n${value.slice(at)}`)
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Image upload failed. Check file size limits.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Editor Tabs / Mode Switcher */}
      <div className="editor-tabs" role="tablist" style={{ borderBottom: 'none', marginBottom: '0.75rem' }}>
        <div 
          style={{ 
            background: 'var(--surface-2)', 
            padding: '0.3rem', 
            borderRadius: 'var(--radius)', 
            display: 'inline-flex', 
            gap: '0.2rem',
            border: '1px solid var(--border)' 
          }}
        >
          <button
            type="button"
            onClick={() => setTab('write')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer',
              color: tab === 'write' ? 'var(--brand-blue-700)' : 'var(--text-2)',
              background: tab === 'write' ? '#fff' : 'transparent',
              boxShadow: tab === 'write' ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--dur-fast) var(--ease)'
            }}
          >
            <Edit3 size={14} /> Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer',
              color: tab === 'preview' ? 'var(--brand-blue-700)' : 'var(--text-2)',
              background: tab === 'preview' ? '#fff' : 'transparent',
              boxShadow: tab === 'preview' ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--dur-fast) var(--ease)'
            }}
          >
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      {tab === 'write' && (
        <div style={{ animation: 'fade-in var(--dur-fast) var(--ease)' }}>
          
          {/* Formatting Toolbar */}
          <div 
            className="editor-toolbar" 
            aria-label="Formatting"
            style={{ 
              background: 'var(--surface-2)', 
              padding: '0.4rem', 
              borderRadius: 'var(--radius) var(--radius) 0 0', 
              border: '1px solid var(--border-strong)',
              borderBottom: 'none',
              display: 'flex', gap: '0.3rem', flexWrap: 'wrap'
            }}
          >
            <button type="button" onClick={() => surround('**', '**', 'bold text')} title="Bold">
              <Bold size={15} />
            </button>
            <button type="button" onClick={() => surround('*', '*', 'italic text')} title="Italic">
              <Italic size={15} />
            </button>
            <button type="button" onClick={() => surround('`', '`', 'code')} title="Inline code">
              <Code size={15} />
            </button>
            <button type="button" onClick={() => surround('\n```\n', '\n```\n', 'code block')} title="Code block">
              <FileCode size={15} />
            </button>
            <button type="button" onClick={() => prependLine('## ')} title="Heading">
              <Heading2 size={15} />
            </button>
            <button type="button" onClick={() => prependLine('> ')} title="Quote">
              <Quote size={15} />
            </button>
            <button type="button" onClick={() => prependLine('- ')} title="Bullet list">
              <List size={15} />
            </button>
            <button type="button" onClick={() => prependLine('1. ')} title="Numbered list">
              <ListOrdered size={15} />
            </button>
            <button type="button" onClick={() => surround('[', '](https://)', 'link text')} title="Link">
              <Link size={15} />
            </button>
            
            <button 
              type="button" 
              onClick={() => fileRef.current?.click()} 
              disabled={uploading} 
              title="Upload image"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {uploading ? <Loader2 size={15} className="spinner--sm" /> : <ImageIcon size={15} />}
            </button>
            
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadImage(file)
                e.target.value = ''
              }}
            />
          </div>

          <textarea
            ref={textareaRef}
            className="textarea"
            style={{ 
              minHeight, 
              borderTopLeftRadius: 0, 
              borderTopRightRadius: 0,
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />

          {uploadError && <div className="form-error mt-1">{uploadError}</div>}
          
          <p className="hint muted mt-1">
            Markdown supported. Images up to 5 MB (PNG, JPG, WEBP) — remove personal or sensitive information from screenshots before uploading.
          </p>
        </div>
      )}

      {tab === 'preview' && (
        <div className="panel" style={{ minHeight, animation: 'fade-in var(--dur-fast) var(--ease)' }}>
          <div className="panel__body rich-text" style={{ padding: '1.5rem' }}>
            {value.trim() ? <RichText markdown={value} /> : <span className="muted" style={{ fontStyle: 'italic' }}>Nothing to preview yet. Start typing in the Write tab.</span>}
          </div>
        </div>
      )}
    </div>
  )
}