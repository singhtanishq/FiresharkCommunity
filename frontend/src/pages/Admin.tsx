import { useCallback, useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { api, apiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from '../components/ui/States'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { formatNumber, reportReasonLabels, timeAgo, verificationLabels } from '../lib/format'
import { 
  LayoutDashboard, Flag, MessageSquare, FileText, Users, 
  FolderOpen, Award, Settings, CheckCircle2, 
  EyeOff, Lock, AlertCircle, ShieldCheck, Trash2, Clock, Search
} from 'lucide-react'

// ------------------------------------------------------------------ shell

const ADMIN_NAV = [
  ['/admin', <LayoutDashboard size={18} strokeWidth={2} />, 'Dashboard'],
  ['/admin/reports', <Flag size={18} strokeWidth={2} />, 'Reports'],
  ['/admin/questions', <MessageSquare size={18} strokeWidth={2} />, 'Questions'],
  ['/admin/answers', <FileText size={18} strokeWidth={2} />, 'Answers'],
  ['/admin/users', <Users size={18} strokeWidth={2} />, 'Users'],
  ['/admin/categories', <FolderOpen size={18} strokeWidth={2} />, 'Categories & tags'],
  ['/admin/badges', <Award size={18} strokeWidth={2} />, 'Badges & reputation'],
  ['/admin/settings', <Settings size={18} strokeWidth={2} />, 'Settings & config'],
] as const

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/" replace />

  return (
    <div className="admin-layout" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
      <nav className="admin-nav panel" style={{ padding: '0.75rem', position: 'sticky', top: 'calc(var(--header-h) + 1.5rem)', boxSizing: 'border-box' }} aria-label="Admin">
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Administration
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {ADMIN_NAV.map(([to, icon, label]) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/admin'} 
              className={({ isActive }) => `row ${isActive ? 'is-active' : ''}`}
              style={{ 
                padding: '0.6rem 0.85rem', 
                borderRadius: 'var(--radius)', 
                textDecoration: 'none',
                transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {icon} <span style={{ fontWeight: 500 }}>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div style={{ minWidth: 0, width: '100%', overflowX: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  )
}

export function AdminHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-word' }}>
        {title}
      </h1>
      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  )
}

// -------------------------------------------------------------- dashboard

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setData(r.data.data))
  }, [])

  if (!data) return <Spinner />

  const { stats, recent_activity: activity } = data

  const StatCard = ({ value, label, warn = false }: { value: string | number, label: string, warn?: boolean }) => (
    <div 
      className="panel stat-card" 
      style={{ 
        border: warn ? '1px solid var(--danger)' : undefined,
        background: warn ? 'var(--danger-bg)' : 'var(--surface)',
        transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
        boxSizing: 'border-box'
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
    >
      <b style={{ color: warn ? 'var(--danger)' : 'var(--ink-900)', fontSize: '1.75rem' }}>{value}</b>
      <span style={{ color: warn ? '#991b1b' : 'var(--text-3)' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title="Dashboard Overview" />

      <div className="stat-grid mb-3">
        <StatCard value={formatNumber(stats.users.total)} label="Total users" />
        <StatCard value={formatNumber(stats.users.active_month)} label="Active this month" />
        <StatCard value={formatNumber(stats.questions.published)} label="Published questions" />
        <StatCard value={formatNumber(stats.questions.unanswered)} label="Unanswered" />
        <StatCard value={formatNumber(stats.answers.total)} label="Total Answers" />
        <StatCard value={formatNumber(stats.reports.pending)} label="Open reports" warn={stats.reports.pending > 0} />
      </div>

      <div className="grid-2">
        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header">
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Recent questions</h2>
            <NavLink to="/admin/questions" className="muted text-3">View all →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.questions.map((q: any) => (
              <div 
                key={q.id} 
                className="row row--between" 
                style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'wrap', gap: '0.5rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  {q.status === 'hidden' && <EyeOff size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />}
                  {q.status === 'closed' && <Lock size={14} color="var(--warning)" style={{ flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {q.title}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(q.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header">
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Latest reports</h2>
            <NavLink to="/admin/reports" className="muted text-3">Review queue →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.reports.length === 0 && <p className="muted" style={{ padding: '1.5rem', textAlign: 'center' }}>No recent reports.</p>}
            {activity.reports.map((report: any) => (
              <div 
                key={report.id} 
                className="row row--between" 
                style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'wrap', gap: '0.5rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                  <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0 }} /> 
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, wordBreak: 'break-word' }}>
                    {reportReasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="chip chip--ghost" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>{report.status}</span>
                </div>
                <span className="muted" style={{ fontSize: '0.78rem', flexShrink: 0 }}>{timeAgo(report.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- reports

export function AdminReports() {
  const [reports, setReports] = useState<any[]>([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/reports', { params: { status: status || undefined } })
      .then((r) => setReports(r.data.data))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(load, [load])

  const resolve = async (reportId: number, newStatus: string, action: string) => {
    setBusyId(reportId)
    try {
      await api.post(`/admin/reports/${reportId}/status`, { status: newStatus, action, resolution_note: note || undefined })
      load()
      setNote('')
    } catch (e) {
      alert(apiError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title="Moderation Queue">
        <select className="select" style={{ width: '100%', maxWidth: '180px' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter reports">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <div className="panel" style={{ padding: '3rem 1rem' }}>
          <EmptyState icon={<ShieldCheck size={40} color="var(--success)" strokeWidth={1.5} />} title="Queue is empty. Great job." />
        </div>
      ) : (
        <div className="question-list">
          {reports.map((report) => (
            <div key={report.id} className="panel" style={{ padding: '1.25rem', boxSizing: 'border-box', overflowX: 'hidden' }}>
              <div className="row row--between mb-1" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span className={`chip ${report.status === 'pending' ? '' : 'chip--ghost'}`} style={{ flexShrink: 0 }}>
                    {reportReasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="text-3 muted row" style={{ gap: '0.3rem', flexShrink: 0 }}>
                    <Clock size={12} /> {timeAgo(report.created_at)}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: report.status === 'pending' ? 'var(--warning)' : 'var(--text-3)', flexShrink: 0 }}>
                  {report.status}
                </span>
              </div>
              
              <div style={{ background: 'var(--surface-3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--brand-blue-400)', margin: '0.75rem 0', fontSize: '0.9rem', color: 'var(--ink-800)', wordBreak: 'break-word' }}>
                {report.target_excerpt ?? <span className="muted"><i>(Content already deleted)</i></span>}
              </div>
              
              <p className="text-3 mb-2" style={{ wordBreak: 'break-word' }}>
                {report.description && <span><b>Context:</b> “{report.description}” — </span>}
                Reported by <b>{report.reporter?.name ?? 'Unknown user'}</b> on {report.reportable_type} #{report.reportable_id}
              </p>

              {report.status === 'pending' || report.status === 'reviewing' ? (
                <div className="row" style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <input className="input input--sm" style={{ flex: '1 1 200px', minWidth: '160px' }} placeholder="Resolution note (optional)..." value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' }}>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'reviewing', 'none')} style={{ flex: '1 1 auto' }}>Reviewing</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'dismissed', 'none')} style={{ flex: '1 1 auto' }}>Dismiss</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'hide')} style={{ flex: '1 1 auto' }}><EyeOff size={14} /> Hide</button>
                    <button className="btn btn--danger btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'delete')} style={{ flex: '1 1 auto' }}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ) : (
                <div className="row" style={{ fontSize: '0.82rem', color: 'var(--text-2)', background: 'var(--surface-2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                  {report.handled_by && <span>Handled by <b>{report.handled_by.name}</b>:</span>}
                  <span style={{ wordBreak: 'break-word' }}>{report.resolution_note || 'No resolution note provided.'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- content

export function AdminContent({ kind }: { kind: 'questions' | 'answers' }) {
  const [items, setItems] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/admin/${kind}`, { params: { status: statusFilter || undefined, q: q || undefined } })
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false))
  }, [kind, statusFilter, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const act = async (action: string, body: Record<string, unknown>) => {
    try {
      await api.post(`/admin/content/${action}`, body)
      load()
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title={kind === 'questions' ? 'Questions Library' : 'Answers Library'}>
        <select className="select" style={{ width: '100%', maxWidth: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="closed">Closed</option>
        </select>
        <div className="input-affix" style={{ width: '100%', maxWidth: '260px' }}>
          <Search className="input-affix__icon" size={16} />
          <input className="input input--with-affix" placeholder="Search content..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="panel"><EmptyState icon={<FolderOpen size={32} strokeWidth={1.5} />} title="No content found." /></div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th>Content Details</th>
                <th>Author</th>
                {kind === 'questions' && <th>Status</th>}
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const title = kind === 'questions' ? item.title : item.question?.title
                const slug = kind === 'questions' ? item.slug : item.question?.slug
                const type = kind === 'questions' ? 'question' : 'answer'
                const isHidden = item.status === 'hidden'
                return (
                  <tr key={item.id}>
                    <td style={{ maxWidth: 360 }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {slug ? <a href={`/questions/${slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-900)' }}>{title}</a> : title}
                      </div>
                      {kind === 'answers' && <div className="muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>{item.excerpt}</div>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
                        <Avatar name={item.user?.name ?? '?'} size="sm" />
                        <span style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.user?.name ?? '—'}</span>
                      </div>
                    </td>
                    {kind === 'questions' && (
                      <td>
                        <span className={`chip ${isHidden ? 'chip--ghost' : ''}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {item.status}
                        </span>
                      </td>
                    )}
                    <td className="muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</td>
                    <td>
                      <div className="row" style={{ gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {isHidden ? (
                          <button className="btn btn--ghost btn--sm" onClick={() => act('restore', { type, id: item.id })}>Restore</button>
                        ) : (
                          <button className="btn btn--ghost btn--sm" onClick={() => act('hide', { type, id: item.id, reason: 'Moderation: hidden' })}>Hide</button>
                        )}
                        <button className="btn btn--danger btn--sm" style={{ padding: '0.36rem' }} onClick={() => { if (window.confirm('Delete this content permanently?')) act('delete', { type, id: item.id, reason: 'Deleted by moderation' }) }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ users

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const { user: me } = useAuth()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/users', { params: { q: q || undefined } })
      .then((r) => {
        setUsers(r.data.data)
        setMeta({ current_page: r.data.meta.current_page, last_page: r.data.meta.last_page })
      })
      .finally(() => setLoading(false))
  }, [q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const action = async (path: string, body?: Record<string, unknown>) => {
    try {
      await api.post(path, body)
      load()
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title="User Directory">
        <div className="input-affix" style={{ width: '100%', maxWidth: '280px' }}>
          <Search className="input-affix__icon" size={16} />
          <input className="input input--with-affix" placeholder="Search name, username or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="panel" style={{ overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Role</th>
                  <th>Reputation</th>
                  <th>Activity (Q/A)</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="row" style={{ gap: '0.75rem', flexWrap: 'nowrap' }}>
                        <Avatar name={u.name} path={u.avatar_path} size="md" />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <a href={`/users/${u.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</a>
                          <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {me?.role === 'admin' ? (
                        <select className="select" style={{ width: '120px', padding: '0.35rem', fontSize: '0.85rem' }} value={u.role} onChange={(e) => action(`/admin/users/${u.id}/role`, { role: e.target.value })} aria-label={`Role for ${u.name}`}>
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="chip chip--ghost">{u.role}</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-blue-600)', whiteSpace: 'nowrap' }}>{formatNumber(u.reputation)}</td>
                    <td className="muted" style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{u.questions_count} <span style={{ opacity: 0.5 }}>/</span> {u.answers_count}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {u.is_suspended ? (
                        <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><Lock size={12} /> Suspended</span>
                      ) : u.verification ? (
                        <span className="verified-chip"><Award size={12} /> {verificationLabels[u.verification] ?? u.verification}</span>
                      ) : (
                        <span className="chip chip--ghost" style={{ fontSize: '0.75rem' }}>Active</span>
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {me?.role === 'admin' && (
                          <>
                            <button className="btn btn--ghost btn--sm" onClick={() => {
                              const type = window.prompt('Verification type: team, instructor, expert, alumni, professional')
                              if (type) action(`/admin/users/${u.id}/verify`, { type })
                            }}>Verify</button>
                            {u.verification && (
                              <button className="btn btn--ghost btn--sm" onClick={() => action(`/admin/users/${u.id}/revoke-verification`)}>Unverify</button>
                            )}
                          </>
                        )}
                        {u.is_suspended ? (
                          <button className="btn btn--ghost btn--sm" onClick={() => action(`/admin/users/${u.id}/unsuspend`)}>Restore</button>
                        ) : (
                          <button className="btn btn--danger btn--sm" onClick={() => {
                            const reason = window.prompt('Suspension reason:')
                            if (reason) action(`/admin/users/${u.id}/suspend`, { reason })
                          }}>Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2" style={{ width: '100%', boxSizing: 'border-box' }}>
            <Pagination meta={meta} baseUrl="/admin/users" />
          </div>
        </>
      )}
    </div>
  )
}