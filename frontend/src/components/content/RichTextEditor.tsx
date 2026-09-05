import { useRef, useState } from 'react'
import { RichText } from './RichText'
import { mediaApi } from '../../api/endpoints'

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
    if (! el) return
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
    if (! el) return
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
      setUploadError(e?.response?.data?.message ?? 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="editor-tabs" role="tablist">
        <button type="button" className={tab === 'write' ? 'is-active' : ''} onClick={() => setTab('write')}>Write</button>
        <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>Preview</button>
      </div>

      {tab === 'write' && (
        <div>
          <div className="editor-toolbar" aria-label="Formatting">
            <button type="button" onClick={() => surround('**', '**', 'bold text')} title="Bold"><b>B</b></button>
            <button type="button" onClick={() => surround('*', '*', 'italic text')} title="Italic"><i>I</i></button>
            <button type="button" onClick={() => surround('`', '`', 'code')} title="Inline code">{'</>'}</button>
            <button type="button" onClick={() => surround('\n```\n', '\n```\n', 'code block')} title="Code block">{'{ }'}</button>
            <button type="button" onClick={() => prependLine('## ')} title="Heading">H2</button>
            <button type="button" onClick={() => prependLine('> ')} title="Quote">❝</button>
            <button type="button" onClick={() => prependLine('- ')} title="Bullet list">•</button>
            <button type="button" onClick={() => prependLine('1. ')} title="Numbered list">1.</button>
            <button type="button" onClick={() => surround('[', '](https://)', 'link text')} title="Link">🔗</button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image">
              {uploading ? '…' : '🖼️'}
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
            style={{ minHeight }}
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
        <div className="panel" style={{ minHeight }}>
          <div className="panel__body rich-text">
            {value.trim() ? <RichText markdown={value} /> : <span className="muted">Nothing to preview yet.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
