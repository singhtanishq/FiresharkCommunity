import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { categoriesApi, tagsApi, questionsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { RichTextEditor } from '../components/content/RichTextEditor'
import { apiError } from '../api/client'
import type { Category, Question, Tag } from '../types'
import { AlertTriangle } from 'lucide-react'

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
  const [draft, setDraft] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string[]> } | null>(null)

  useEffect(() => {
    categoriesApi.list().then((list) => {
      setCategories(list)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (! editing) return
    questionsApi.list({ per_page: 50 }).then(() => undefined) // warm cache, ignored
    // Load the question for editing.
    void (async () => {
      // The show endpoint needs a slug; the admin edit path uses id-based
      // lookup, so ask via the paginated author query instead.
    })()
  }, [editId])

  useEffect(() => {
    const term = tagInput.trim()
    if (! term) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      tagsApi.suggest(term).then(setSuggestions).catch(() => undefined)
    }, 200)
    return () => clearTimeout(t)
  }, [tagInput])

  if (! user) {
    return (
      <div className="panel" style={{ maxWidth: 520, margin: '2rem auto' }}>
        <div className="panel__body" style={{ textAlign: 'center' }}>
          <h2>Log in to ask a question</h2>
          <p className="muted">Join the FireShark Community to ask questions, answer and vote.</p>
          <button className="btn btn--primary" onClick={() => navigate('/login', { state: { from: '/ask' } })}>Log in</button>
        </div>
      </div>
    )
  }

  if (loading) return null

  const addTag = (tag: string) => {
    const slug = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && ! tags.includes(slug) && tags.length < 5) setTags([...tags, slug])
    setTagInput('')
    setSuggestions([])
  }

  const submit = async (asDraft: boolean) => {
    setBusy(true)
    setErrors(null)
    const payload = {
      title,
      body,
      category_id: Number(categoryId),
      tags,
      status: asDraft ? 'draft' : 'published',
    }
    try {
      const created = await questionsApi.create(payload)
      navigate(`/questions/${created.slug}`)
    } catch (e: any) {
      const err = apiError(e)
      setErrors({ message: err.message, fields: err.errors ?? {} })
      setBusy(false)
    }
  }

  const addTag = (tag: string) => {
    const slug = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && ! tags.includes(slug) && tags.length < 5) setTags([...tags, slug])
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

  const addTag = (tag: string) => {
    const slug = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && ! tags.includes(slug) && tags.length < 5) setTags([...tags, slug])
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

  return (
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 760 }}>
      <h1>{editId ? 'Edit your question' : 'Ask a question'}</h1>
      <p className="muted mb-2">
        Be specific, include what you have tried, and share error output inside code blocks. Read the{' '}
        <a href="/community-guidelines">community guidelines</a> before posting.
      </p>

      {errors && (
        <div className="form-error">
          <b>{errors.message}</b>
          {Object.entries(errors.fields).map(([field, messages]) => (
            <div key={field}>{messages.join(' ')}</div>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="title">
          Title <span className="counter" style={{ color: title.length > 180 ? 'var(--red-600)' : undefined }}>{title.length}/180</span>
        </label>
        <input
          id="title"
          className="input"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. How can I troubleshoot an Nmap scan that shows no open ports?"
        />
        <p className="hint">
          {title.length >= 15
            ? 'Good — a clear title helps others find your question.'
            : 'Minimum 15 characters. Describe the problem, not your goal only.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select a category…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tags">Tags (up to 5)</label>
        <div className="row" style={{ marginBottom: '0.4rem' }}>
          {tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}{' '}
              <button
                type="button"
                style={{ all: 'unset', cursor: 'pointer', marginLeft: 4 }}
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
              >×</button>
            </span>
          ))}
        </div>
        <input
          id="tags"
          className="input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(tagInput)
            }
          }}
          placeholder="Type a tag and press Enter — e.g. nmap, wireshark, kali-linux"
        />
        {suggestions.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.filter((s) => ! tags.includes(s.slug)).map((s) => (
              <button key={s.id} type="button" className="tag-chip" style={{ cursor: 'pointer', border: 'none' }} onClick={() => addTag(s.slug)}>
                {s.name} · {s.questions_count}
              </button>
            ))}
          </div>
        )}
        <p className="hint">Existing tags are suggested as you type. New tags are reviewed by moderators.</p>
      </div>

      <div className="field">
        <label>What are you trying to accomplish?</label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder={'Describe your question in detail:\n\n- What are you trying to accomplish?\n- What have you already tried?\n- What error do you receive? Include the exact output in a code block.\n- What is your environment (OS, tool version)?'}
        />
      </div>

      <div className="banner banner--info">
        <AlertTriangle size={18} strokeWidth={2} style={{ marginRight: 8 }} aria-hidden="true" />
        Never publish passwords, API keys, tokens or personal data — including inside screenshots.
      </div>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {! editing && (
          <button
            className="btn btn--ghost"
            disabled={busy || ! title.trim() || ! body.trim()}
            onClick={() => { setDraft(true); void submit(true) }}
          >
            Save draft
          </button>
        )}
        <button
          className="btn btn--fire btn--lg"
          disabled={busy || title.length < 15 || title.length > 180 || body.trim().length < 30 || ! categoryId}
          onClick={() => { setDraft(false); void submit(false) }}
        >
          {busy ? 'Publishing…' : 'Publish question'}
        </button>
      </div>
    </div>
  )
}