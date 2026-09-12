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
import { 
  Bell, Bookmark, Mail, User, Shield, AlertOctagon, 
  MapPin, Globe, CheckCircle2, AlertTriangle, Briefcase
} from 'lucide-react'

// =====================================================================
// NOTIFICATIONS
// =====================================================================

export function Notifications() {
  const { user, setUnreadCount } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<{ data: AppNotification[]; meta: { current_page: number; last_page: number; total: number } } | null>(null)

  useEffect(() => {
    if (!user) return
    notificationsApi.list().then((res) => {
      setData({ data: res.data, meta: res.meta })
      setUnreadCount(res.unread_count)
    })
  }, [user, setUnreadCount])

  if (!user) {
    navigate('/login', { state: { from: '/notifications' } })
    return null
  }

  if (!data) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>

  const markAll = async () => {
    await notificationsApi.markAllRead()
    setData((prev) => prev
      ? { ...prev, data: prev.data.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) }
      : prev)
    setUnreadCount(0)
  }

  const open = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await notificationsApi.markRead(notification.id).catch(() => undefined)
    }
    navigate(notification.url)
  }

  return (
    <div className="app-main" style={{ maxWidth: 800, margin: '0 auto', animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      <div className="row row--between mb-4" style={{ alignItems: 'flex-end', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={28} color="var(--brand-blue-600)" strokeWidth={2.5} /> Intel Alerts
          </h1>
          <span className="muted" style={{ fontSize: '1.05rem' }}>Your personal notification feed.</span>
        </div>
        {data.data.length > 0 && (
          <button className="btn btn--ghost" onClick={markAll}>
            <CheckCircle2 size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden', animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
        {data.data.length === 0 ? (
          <div style={{ padding: '4rem 2rem' }}>
            <EmptyState icon={<Bell size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} title="All clear. No unread alerts." />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.data.map((notification) => {
              const isUnread = !notification.read_at
              return (
                <button
                  key={notification.id}
                  onClick={() => open(notification)}
                  style={{
                    display: 'flex', width: '100%', textAlign: 'left', padding: '1.25rem 1.5rem',
                    background: isUnread ? 'var(--brand-blue-50)' : 'transparent',
                    border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    fontFamily: 'var(--font)', color: 'var(--ink-900)',
                    transition: 'background var(--dur) var(--ease)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = isUnread ? '#d8ebfb' : 'var(--surface-2)'}
                  onMouseOut={e => e.currentTarget.style.background = isUnread ? 'var(--brand-blue-50)' : 'transparent'}
                >
                  <div className="row" style={{ gap: '1rem', flex: 1, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '0.2rem', color: isUnread ? 'var(--brand-blue-600)' : 'var(--text-3)' }}>
                      <Bell size={16} strokeWidth={isUnread ? 2.5 : 2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: isUnread ? 700 : 500, lineHeight: 1.5, marginBottom: '0.2rem' }}>
                        {notification.message}
                      </div>
                      <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    {isUnread && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-blue-600)', marginTop: '0.4rem' }} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================================
// BOOKMARKS
// =====================================================================

export function Bookmarks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    if (!user) return
    bookmarksApi.list({ page }).then((res) => {
      setQuestions(res.data)
      setMeta(res.meta)
    }).finally(() => setLoading(false))
  }, [user, page])

  if (!user) {
    navigate('/login', { state: { from: '/bookmarks' } })
    return null
  }

  if (loading) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      <div className="row row--between mb-4" style={{ alignItems: 'flex-end', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bookmark size={28} color="var(--brand-blue-600)" strokeWidth={2.5} /> Saved Intel
          </h1>
          <span className="muted" style={{ fontSize: '1.05rem' }}>{meta.total} bookmarked discussions.</span>
        </div>
      </div>

      <div style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
        {questions.length === 0 ? (
          <div className="panel" style={{ padding: '4rem 2rem' }}>
            <EmptyState
              icon={<Bookmark size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />}
              title="Your saved repository is empty."
              action={<Link to="/questions" className="btn btn--primary">Browse Live Feed</Link>}
            />
          </div>
        ) : (
          <div className="question-list" style={{ gap: '1rem' }}>
            {questions.map((question) => (
              <div 
                key={question.id} 
                style={{ transition: 'transform 0.3s ease' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} 
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <QuestionCard question={question} />
              </div>
            ))}
          </div>
        )}
      </div>

      {meta.last_page > 1 && (
        <div className="mt-4 row row--between" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.2s both' }}>
          <Pagination meta={meta} baseUrl="/bookmarks" />
        </div>
      )}
    </div>
  )
}

// =====================================================================
// SETTINGS
// =====================================================================

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

  if (!user) {
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
      setTimeout(() => setSaved(false), 3000)
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
      setPwMessage('Password updated successfully.')
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
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 760, animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      <div style={{ marginBottom: '2.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 0.2rem' }}>
          Account Settings
        </h1>
        <p className="muted" style={{ fontSize: '1.05rem', margin: 0 }}>Manage your profile identity, security, and account status.</p>
      </div>

      {!user.email_verified && (
        <div className="banner banner--warn mb-4" style={{ borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
          <Mail size={20} strokeWidth={2} style={{ flexShrink: 0, color: '#b45309' }} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', color: '#92400e', marginBottom: '0.2rem' }}>Verification Required</strong>
            <span style={{ color: '#92400e', fontSize: '0.9rem' }}>Check your inbox to verify your email address. Some features are restricted until verified.</span>
          </div>
          <button
            className="btn btn--quiet btn--sm"
            style={{ color: '#b45309', background: 'rgba(251, 191, 36, 0.2)' }}
            onClick={async () => {
              const { api } = await import('../api/client')
              await api.post('/auth/email/verification-notification').catch(() => undefined)
              alert('Verification email sent.')
            }}
          >
            Resend Email
          </button>
        </div>
      )}

      {/* Profile Section */}
      <section className="panel mb-4" style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
        <div className="panel__header">
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--brand-blue-600)" /> Profile Identity
          </h2>
        </div>
        <div className="panel__body" style={{ padding: '2rem' }}>
          {saved && (
            <div className="banner banner--success mb-3" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
              <CheckCircle2 size={18} /> Profile updated successfully.
            </div>
          )}
          {error && (
            <div className="banner banner--danger mb-3" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
              <AlertTriangle size={18} /> {error}
            </div>
          )}
          
          <form onSubmit={saveProfile}>
            <div className="field">
              <label htmlFor="set-name">Display Name</label>
              <input id="set-name" className="input input--lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="set-bio">Biography</label>
              <textarea id="set-bio" className="textarea" style={{ minHeight: 100 }} value={form.bio} maxLength={1000} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the community about your background..." />
            </div>
            
            <div className="grid-2 mt-2">
              <div className="field">
                <label htmlFor="set-expertise">Primary Expertise</label>
                <div className="input-affix">
                  <Briefcase className="input-affix__icon" size={16} />
                  <input id="set-expertise" className="input input--with-affix" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="e.g. SOC Analyst, Pentester" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="set-location">Location</label>
                <div className="input-affix">
                  <MapPin className="input-affix__icon" size={16} />
                  <input id="set-location" className="input input--with-affix" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. London, UK" />
                </div>
              </div>
            </div>
            
            <div className="field">
              <label htmlFor="set-website">Personal Website / Link</label>
              <div className="input-affix">
                <Globe className="input-affix__icon" size={16} />
                <input id="set-website" type="url" className="input input--with-affix" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Security Section */}
      <section className="panel mb-4" style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.2s both' }}>
        <div className="panel__header">
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--brand-blue-600)" /> Security
          </h2>
        </div>
        <div className="panel__body" style={{ padding: '2rem' }}>
          {pwMessage && (
            <div className="banner banner--success mb-3" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
              <CheckCircle2 size={18} /> {pwMessage}
            </div>
          )}
          {pwError && (
            <div className="banner banner--danger mb-3" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
              <AlertTriangle size={18} /> {pwError}
            </div>
          )}
          
          <form onSubmit={savePassword}>
            <div className="field mb-3">
              <label htmlFor="set-current">Current Password</label>
              <input id="set-current" type="password" className="input" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required autoComplete="current-password" placeholder="••••••••" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="set-new">New Password</label>
                <input id="set-new" type="password" className="input" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} required minLength={8} autoComplete="new-password" placeholder="••••••••" />
              </div>
              <div className="field">
                <label htmlFor="set-confirm">Confirm New Password</label>
                <input id="set-confirm" type="password" className={`input ${passwords.password_confirmation && passwords.password_confirmation !== passwords.password ? 'input--error' : ''}`} value={passwords.password_confirmation} onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })} required autoComplete="new-password" placeholder="••••••••" />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn--primary" disabled={!passwords.current_password || !passwords.password || passwords.password !== passwords.password_confirmation}>
                Update Security Credentials
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="panel" style={{ borderTop: '4px solid var(--danger)', animation: 'modal-rise var(--dur-slow) var(--ease) 0.25s both' }}>
        <div className="panel__header">
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertOctagon size={18} /> Danger Zone
          </h2>
        </div>
        <div className="panel__body" style={{ padding: '2rem' }}>
          {deleteError && (
            <div className="banner banner--danger mb-3" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
              <AlertTriangle size={18} /> {deleteError}
            </div>
          )}
          
          {!showDelete ? (
            <div className="row row--between" style={{ alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <strong style={{ display: 'block', color: 'var(--ink-900)', marginBottom: '0.2rem' }}>Deactivate Account</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Deactivating your account hides your profile immediately. Your community contributions will remain, but anonymised.
                </p>
              </div>
              <button className="btn btn--danger" onClick={() => setShowDelete(true)}>
                Deactivate account...
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void deleteAccount() }} style={{ animation: 'fade-in var(--dur-fast) var(--ease)' }}>
              <div className="banner banner--danger mb-3">
                <AlertTriangle size={18} /> You are about to deactivate your account. This action is significant.
              </div>
              <div className="field mb-3">
                <label htmlFor="set-delete">Confirm your password to authorize deactivation</label>
                <input id="set-delete" type="password" className="input input--lg" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required autoComplete="current-password" autoFocus placeholder="••••••••" />
              </div>
              <div className="row" style={{ gap: '1rem' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowDelete(false)}>Cancel Request</button>
                <button className="btn btn--danger" disabled={!deletePassword}>Confirm Deactivation</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}