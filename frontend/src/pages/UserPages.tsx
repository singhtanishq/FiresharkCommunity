import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { bookmarksApi, notificationsApi } from '../api/endpoints'
import type { AppNotification, Question } from '../types'
import { useAuth } from '../context/AuthContext'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'
import { timeAgo } from '../lib/format'
import { apiError } from '../api/client'

export function Notifications() {
  const { user, setUnreadCount } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<{ data: AppNotification[]; meta: { current_page: number; last_page: number; total: number } } | null>(null)

  useEffect(() => {
    if (! user) return
    notificationsApi.list().then((res) => {
      setData({ data: res.data, meta: res.meta })
      setUnreadCount(res.unread_count)
    })
  }, [user, setUnreadCount])

  if (! user) {
    navigate('/login', { state: { from: '/notifications' } })
    return null
  }

  if (! data) return <Spinner />

  const markAll = async () => {
    await notificationsApi.markAllRead()
    setData((prev) => prev
      ? { ...prev, data: prev.data.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) }
      : prev)
    setUnreadCount(0)
  }

  const open = async (notification: AppNotification) => {
    if (! notification.read_at) {
      await notificationsApi.markRead(notification.id).catch(() => undefined)
    }
    navigate(notification.url)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-toolbar">
        <h1>Notifications</h1>
        <button className="btn btn--ghost btn--sm" onClick={markAll}>Mark all as read</button>
      </div>

      <div className="panel">
        {data.data.length === 0
          ? <EmptyState icon={<Bell size={32} strokeWidth={1.5} />} title="You're all caught up." />
          : data.data.map((notification) => (
            <button
              key={notification.id}
              onClick={() => open(notification)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.85rem 1.15rem',
                background: notification.read_at ? 'transparent' : 'var(--blue-50)',
                border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: '0.92rem', color: 'var(--ink)',
              }}
            >
              <span className="row--between row">
                <span>
                  {! notification.read_at && <b style={{ color: 'var(--blue-600)' }}>● </b>}
                  {notification.message}
                </span>
                <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{timeAgo(notification.created_at)}</span>
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}

export function Bookmarks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    if (! user) return
    bookmarksApi.list({ page }).then((res) => {
      setQuestions(res.data)
      setMeta(res.meta)
    }).finally(() => setLoading(false))
  }, [user, page])

  if (! user) {
    navigate('/login', { state: { from: '/bookmarks' } })
    return null
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-toolbar">
        <h1>Bookmarks</h1>
        <span className="muted">{meta.total} saved</span>
      </div>

      {questions.length === 0
        ? (
          <div className="panel">
            <EmptyState
              icon={<Bookmark size={32} strokeWidth={1.5} />}
              title="You haven't bookmarked anything yet."
              action={<Link to="/questions" className="btn btn--primary">Browse questions</Link>}
            />
          </div>
        )
        : (
          <div className="question-list">
            {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
          </div>
        )}

      <Pagination meta={meta} baseUrl="/bookmarks" />
    </div>
  )
}

export function Settings() {
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', bio: '', expertise: '', location: '', website: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        bio: user.bio ?? '',
        expertise: user.expertise ?? '',
        location: user.location ?? '',
        website: user.website ?? '',
      })
    }
  }, [user])

  if (! user) {
    navigate('/login', { state: { from: '/settings' } })
    return null
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { api } = await import('../api/client')
      await api.patch('/me/profile', form)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(apiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwMessage(null)
    try {
      const { api } = await import('../api/client')
      await api.put('/me/password', passwords)
      setPwMessage('Password changed.')
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      setPwError(apiError(err).message)
    }
  }

  const deleteAccount = async () => {
    setDeleteError(null)
    try {
      const { api } = await import('../api/client')
      await api.delete('/me/account', { data: { password: deletePassword } })
      await logout()
      navigate('/')
    } catch (err) {
      setDeleteError(apiError(err).message)
    }
  }

  return (
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 700 }}>
      <h1>Settings</h1>

      {! user.email_verified && (
        <div className="banner banner--info">
          ✉️ Your email is not verified yet. Check your inbox for the verification link.
          <button
            className="btn btn--ghost btn--sm"
            onClick={async () => {
              const { api } = await import('../api/client')
              await api.post('/auth/email/verification-notification').catch(() => undefined)
            }}
          >
            Resend
          </button>
        </div>
      )}

      <section className="panel mb-2">
        <div className="panel__header"><h2>Profile</h2></div>
        <div className="panel__body">
          {saved && <div className="form-success">Profile updated.</div>}
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={saveProfile}>
            <div className="field">
              <label htmlFor="set-name">Name</label>
              <input id="set-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="set-bio">Bio</label>
              <textarea id="set-bio" className="textarea" style={{ minHeight: 80 }} value={form.bio} maxLength={1000} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the community about yourself." />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="set-expertise">Expertise</label>
                <input id="set-expertise" className="input" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="e.g. SOC, penetration testing" />
              </div>
              <div className="field">
                <label htmlFor="set-location">Location (optional)</label>
                <input id="set-location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="set-website">Website</label>
              <input id="set-website" type="url" className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          </form>
        </div>
      </section>

      <section className="panel mb-2">
        <div className="panel__header"><h2>Change password</h2></div>
        <div className="panel__body">
          {pwMessage && <div className="form-success">{pwMessage}</div>}
          {pwError && <div className="form-error">{pwError}</div>}
          <form onSubmit={savePassword}>
            <div className="field">
              <label htmlFor="set-current">Current password</label>
              <input id="set-current" type="password" className="input" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required autoComplete="current-password" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="set-new">New password</label>
                <input id="set-new" type="password" className="input" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="field">
                <label htmlFor="set-confirm">Confirm new password</label>
                <input id="set-confirm" type="password" className="input" value={passwords.password_confirmation} onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })} required autoComplete="new-password" />
              </div>
            </div>
            <button className="btn btn--primary">Change password</button>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header"><h2>Danger zone</h2></div>
        <div className="panel__body">
          {deleteError && <div className="form-error">{deleteError}</div>}
          {! showDelete
            ? (
              <>
                <p className="muted" style={{ marginTop: 0 }}>
                  Deactivating your account hides your profile. Your community contributions remain, anonymised.
                </p>
                <button className="btn btn--danger btn--sm" onClick={() => setShowDelete(true)}>Deactivate account…</button>
              </>
            )
            : (
              <form onSubmit={(e) => { e.preventDefault(); void deleteAccount() }}>
                <div className="field">
                  <label htmlFor="set-delete">Confirm your password to deactivate</label>
                  <input id="set-delete" type="password" className="input" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required autoComplete="current-password" />
                </div>
                <div className="row">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowDelete(false)}>Cancel</button>
                  <button className="btn btn--danger btn--sm">Deactivate my account</button>
                </div>
              </form>
            )}
        </div>
      </section>
    </div>
  )
}
