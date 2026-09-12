import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { categoriesApi, tagsApi, questionsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { RichTextEditor } from '../components/content/RichTextEditor'
import { apiError } from '../api/client'
import type { Category, Tag } from '../types'
import { 
  AlertTriangle, X, Lock, Send, Save, 
  HelpCircle, Hash, FolderOpen, BookOpen, PenLine 
} from 'lucide-react'

/**
 * Ask a question. Also handles edit mode via ?edit={id}.
 * The title uses a live character counter (15–180 characters, per the
 * community rules) and the body is a markdown editor with preview.
 */
export function Ask() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string[]> } | null>(null)

  const editing = Boolean(editId)

  useEffect(() => {
    categoriesApi.list().then((list) => {
      setCategories(list)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!editId) return
    // TODO: Load question data for editing if needed
  }, [editId])

  useEffect(() => {
    const term = tagInput.trim()
    if (!term) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      tagsApi.suggest(term).then(setSuggestions).catch(() => undefined)
    }, 200)
    return () => clearTimeout(t)
  }, [tagInput])

  // ------------------------------------------------------------------
  // Unauthenticated State
  // ------------------------------------------------------------------
  if (!user) {
    return (
      <div className="app-main" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', marginTop: '2rem' }}>
        <div className="panel" style={{ maxWidth: 480, width: '100%', padding: '3rem 2rem', textAlign: 'center', animation: 'modal-rise var(--dur-slow) var(--ease)' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--brand-blue-50)', color: 'var(--brand-blue-600)', 
            borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' 
          }}>
            <Lock size={32} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.75rem' }}>Authentication Required</h2>
          <p className="muted mb-3" style={{ lineHeight: 1.6 }}>
            Join the FireShark Community to ask questions, share your expertise, and build your technical reputation.
          </p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => navigate('/login', { state: { from: '/ask' } })}>
            Log in to continue
          </button>
        </div>
      </div>
    )
  }

  if (loading) return null

  const addTag = (tag: string) => {
    const slug = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && !tags.includes(slug) && tags.length < 5) setTags([...tags, slug])
    setTagInput('')
    setSuggestions([])
  }

  const submit = async (asDraft: boolean) => {
    setBusy(true)
    setErrors(null)
    try {
      if (editing && editId) {
        const updated = await questionsApi.update(Number(editId), {
          title,
          body,
          category_id: Number(categoryId),
          tags,
        })
        navigate(`/questions/${updated.slug}`)
        return
      }

      const created = await questionsApi.create({
        title,
        body,
        category_id: Number(categoryId),
        tags,
        status: asDraft ? 'draft' : 'published',
      })
      navigate(`/questions/${created.slug}`)
    } catch (e: any) {
      const err = apiError(e)
      setErrors({ message: err.message, fields: err.errors ?? {} })
      setBusy(false)
    }
  }

  const titleLengthColor = title.length > 180 ? 'var(--danger)' : title.length > 0 && title.length < 15 ? 'var(--warning)' : 'var(--text-3)'

  return (
    <div className="app-main--narrow" style={{ margin: '2rem auto 4rem', maxWidth: 840, padding: '0 1rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem', animation: 'fade-in var(--dur-slow) var(--ease)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '2.2rem', fontWeight: 800 }}>
          <HelpCircle size={32} color="var(--brand-blue-600)" strokeWidth={2.5} />
          {editId ? 'Edit your question' : 'Ask a question'}
        </h1>
        <p className="muted" style={{ fontSize: '1.05rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <BookOpen size={16} /> Be specific, share what you've tried, and review our{' '}
          <a 
            href="/community-guidelines" 
            style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--brand-blue-600)', transition: 'color 0.2s ease' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue-800)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--brand-blue-600)'}
          >
            community guidelines
          </a>.
        </p>
      </div>

      {errors && (
        <div className="banner banner--danger mb-3" style={{ animation: 'modal-rise var(--dur) var(--ease)' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <b style={{ display: 'block', marginBottom: '0.2rem' }}>{errors.message}</b>
            {Object.entries(errors.fields).map(([field, messages]) => (
              <div key={field} style={{ fontSize: '0.85rem' }}>• {messages.join(' ')}</div>
            ))}
          </div>
        </div>
      )}

      {/* Authoring Panel */}
      <div className="panel" style={{ padding: '2.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
        
        {/* Title Field */}
        <div className="field mb-3">
          <div className="row row--between mb-1">
            <label htmlFor="title" style={{ fontSize: '1rem', color: 'var(--ink-900)', margin: 0 }}>
              Question Title
            </label>
            <span className="font-mono text-3" style={{ color: titleLengthColor, fontWeight: 600 }}>
              {title.length} / 180
            </span>
          </div>
          <input
            id="title"
            className={`input input--lg ${title.length > 180 ? 'input--error' : ''}`}
            style={{ fontWeight: 500 }}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How can I troubleshoot an Nmap scan that shows no open ports?"
          />
          <div className="row row--between mt-1">
            <p className="hint" style={{ margin: 0, color: title.length >= 15 ? 'var(--success)' : 'var(--text-3)' }}>
              {title.length >= 15 ? '✓ Good — a clear title helps others find your question.' : 'Minimum 15 characters. Describe the problem, not just your goal.'}
            </p>
          </div>
        </div>

        <div className="grid-2 mb-3" style={{ gap: '1.5rem' }}>
          {/* Category Field */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="category" style={{ fontSize: '0.95rem', color: 'var(--ink-900)', display: 'block', marginBottom: '0.4rem' }}>Category</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FolderOpen size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }} />
              <select 
                id="category" 
                className="select input--with-affix" 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ appearance: 'none', cursor: 'pointer', width: '100%', paddingLeft: '40px' }}
              >
                <option value="" disabled>Select a category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Field */}
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="row row--between mb-1">
              <label htmlFor="tags" style={{ fontSize: '0.95rem', color: 'var(--ink-900)', margin: 0 }}>Tags</label>
              <span className="text-3 muted">{tags.length} / 5</span>
            </div>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Hash size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }} />
              <input
                id="tags"
                className="input input--with-affix"
                value={tagInput}
                disabled={tags.length >= 5}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                placeholder={tags.length >= 5 ? "Tag limit reached" : "Type and press Enter..."}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
            </div>

            {/* Tag Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                {suggestions.filter((s) => !tags.includes(s.slug)).map((s) => (
                  <button 
                    key={s.id} type="button" 
                    className="chip chip--ghost" 
                    style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }} 
                    onClick={() => addTag(s.slug)}
                  >
                    {s.name} <span className="muted ml-1" style={{ marginLeft: 4 }}>({formatNumber(s.questions_count)})</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="row mt-1" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                {tags.map((tag) => (
                  <span key={tag} className="chip" style={{ background: 'var(--brand-blue-50)', color: 'var(--brand-blue-700)', paddingRight: '0.3rem' }}>
                    {tag}
                    <button
                      type="button"
                      style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', marginLeft: 4, opacity: 0.6 }}
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      aria-label={`Remove tag ${tag}`}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body / Rich Text with Clean, Non-Nested Spacing & Symmetrical Padding */}
        <div className="field mb-4">
          <label style={{ fontSize: '1rem', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <PenLine size={16} color="var(--text-3)" />
            Problem Description
          </label>
          <div style={{ width: '100%' }}>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={'Describe your question in detail:\n\n- What are you trying to accomplish?\n- What have you already tried?\n- What error do you receive? Include the exact output in a code block.\n- What is your environment (OS, tool version)?'}
            />
          </div>
          <div style={{ padding: '0.5rem 0.25rem 0' }}>
            <p className="hint muted" style={{ margin: 0, lineHeight: 1.5 }}>
              Markdown supported. Images up to 5 MB (PNG, JPG, WEBP) — remove personal or sensitive information from screenshots before uploading.
            </p>
          </div>
        </div>

        {/* Security Banner */}
        <div className="banner banner--warn" style={{ borderRadius: 'var(--radius-lg)', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <AlertTriangle size={20} strokeWidth={2} style={{ color: '#b45309', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Security Check:</strong> Never publish passwords, API keys, tokens, or personal data — including inside screenshots or console outputs.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="row row--between" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn--quiet btn--sm" onClick={() => navigate(-1)}>Cancel</button>
          
          <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            {!editing && (
              <button
                className="btn btn--ghost"
                disabled={busy || !title.trim() || !body.trim()}
                onClick={() => void submit(true)}
              >
                <Save size={16} /> Save draft
              </button>
            )}
            <button
              className="btn btn--fire btn--lg"
              disabled={busy || title.length < 15 || title.length > 180 || body.trim().length < 30 || !categoryId}
              onClick={() => void submit(false)}
            >
              {busy ? (
                'Publishing…'
              ) : (
                <><Send size={16} /> Publish question</>
              )}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}