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
  FolderOpen, Award, Settings, AlertCircle, CheckCircle, 
  XCircle, Eye, EyeOff, Trash2, Edit, Shield, 
  ChevronDown, AlertTriangle, Search, UserPlus, UserMinus,
  Key, Users, FolderOpen as FolderOpenIcon, Award, BarChart
} from 'lucide-react'

// ------------------------------------------------------------------ shell

const ADMIN_NAV = [
  ['/admin', <LayoutDashboard size={16} strokeWidth={2} />, 'Dashboard'],
  ['/admin/reports', <Flag size={16} strokeWidth={2} />, 'Reports'],
  ['/admin/questions', <MessageSquare size={16} strokeWidth={2} />, 'Questions'],
  ['/admin/answers', <FileText size={16} strokeWidth={2} />, 'Answers'],
  ['/admin/users', <Users size={16} strokeWidth={2} />, 'Users'],
  ['/admin/categories', <FolderOpen size={16} strokeWidth={2} />, 'Categories & tags'],
  ['/admin/badges', <Award size={16} strokeWidth={2} />, 'Badges & reputation'],
  ['/admin/settings', <Settings size={16} strokeWidth={2} />, 'Settings & leaderboard'],
] as const

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (! user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/" replace />

  return (
    <div className="admin-layout">
      <nav className="admin-nav panel" style={{ padding: '0.6rem' }} aria-label="Admin">
        {ADMIN_NAV.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => (isActive ? 'is-active' : '')}>
            {icon} {label}
          </NavLink>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  )
}

function AdminHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="page-toolbar">
      <h1>{title}</h1>
      {children}
    </div>
  )
}

// -------------------------------------------------------------- dashboard

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setData(r.data.data))
  }, [])

  if (! data) return <Spinner />

  const { stats, recent_activity: activity } = data

  return (
    <div>
      <AdminHeader title="Admin dashboard" />

      <div className="stat-grid">
        <div className="panel stat-card"><b>{formatNumber(stats.users.total)}</b><span>Total users</span></div>
        <div className="panel stat-card"><b>{formatNumber(stats.users.active_month)}</b><span>Active this month</span></div>
        <div className="panel stat-card"><b>{formatNumber(stats.questions.published)}</b><span>Published questions</span></div>
        <div className="panel stat-card"><b>{formatNumber(stats.questions.unanswered)}</b><span>Unanswered</span></div>
        <div className="panel stat-card"><b>{formatNumber(stats.questions.solved)}</b><span>Solved</span></div>
        <div className="panel stat-card"><b>{formatNumber(stats.answers.total)}</b><span>Answers</span></div>
        <div className="panel stat-card" style={{ border: stats.reports.pending ? '1px solid var(--red-600)' : undefined }}>
          <b style={{ color: stats.reports.pending ? 'var(--red-600)' : undefined }}>{formatNumber(stats.reports.pending)}</b>
          <span>Open reports</span>
        </div>
        <div className="panel stat-card"><b>{formatNumber(stats.users.suspended)}</b><span>Suspended users</span></div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel__header"><h2>Recent questions</h2></div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.questions.map((q: any) => (
              <div key={q.id} className="row--between row" style={{ padding: '0.5rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.88rem' }}>
                  {q.status === 'hidden' && <span style={{ color: 'var(--muted)' }}>🙈 </span>}
                  {q.status === 'closed' && <span style={{ color: 'var(--red-600)' }}>🔒 </span>}
                  {q.title}
                </span>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{timeAgo(q.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__header"><h2>Latest reports</h2></div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.reports.length === 0 && <p className="muted" style={{ padding: '1rem 1.1rem' }}>No reports yet.</p>}
            {activity.reports.map((report: any) => (
              <div key={report.id} className="row--between row" style={{ padding: '0.5rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.88rem' }}>🚩 {reportReasonLabels[report.reason] ?? report.reason} <span className="muted">({report.status})</span></span>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{timeAgo(report.created_at)}</span>
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
    <div>
      <AdminHeader title="Reports">
        <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter reports">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </AdminHeader>

      {loading
        ? <Spinner />
        : reports.length === 0
          ? <EmptyState icon="✅" title="No reports in this view. The community is behaving." />
          : (
            <div className="panel">
              <div className="panel__body" style={{ padding: 0 }}>
                {reports.map((report) => (
                  <div key={report.id} style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="row--between row">
                      <b>{reportReasonLabels[report.reason] ?? report.reason}</b>
                      <span className={`muted`}>{report.status}</span>
                    </div>
                    <p className="muted" style={{ margin: '0.3rem 0' }}>
                      {report.target_excerpt ?? '(deleted content)'}
                    </p>
                    <p style={{ fontSize: '0.86rem', margin: '0.3rem 0' }}>
                      {report.description && <>“{report.description}” — </>}
                      reported by <b>{report.reporter?.name ?? 'deleted user'}</b> · {timeAgo(report.created_at)} · on {report.reportable_type} #{report.reportable_id}
                    </p>
                    {report.status === 'pending' || report.status === 'reviewing' ? (
                      <div className="row">
                        <input className="input" style={{ maxWidth: 280 }} placeholder="Resolution note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                        <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'reviewing', 'none')}>Reviewing</button>
                        <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'hide')}>Hide content</button>
                        <button className="btn btn--danger btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'delete')}>Delete content</button>
                        <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'dismissed', 'none')}>Dismiss</button>
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                        {report.handled_by && <>Handled by {report.handled_by.name} · </>}
                        {report.resolution_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
      </AdminHeader>
    </div>
  )
}

// ---------------------------------------------------------------- content

export function AdminContent({ kind }: { kind: 'questions' | 'answers' }) {
  const [items, setItems] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const page = 1

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/admin/${kind}`, { params: { status: statusFilter || undefined, q: q || undefined } })
      .then((r) => {
        setItems(r.data.data)
        setMeta({ current_page: r.data.meta.current_page, last_page: r.data.meta.last_page })
      })
      .finally(() => setLoading(false))
  }, [kind, statusFilter, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load])

  const act = async (action: string, body: Record<string, unknown>) => {
    try {
      await api.post(`/admin/content/${action}`, body)
      load()
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div>
      <AdminHeader title={kind === 'questions' ? 'Questions' : 'Answers'}>
        <select className="select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="closed">Closed</option>
        </select>
        <input className="input" style={{ width: 220 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </AdminHeader>

      {loading
        ? <Spinner />
        : items.length === 0
          ? <EmptyState icon="🗂️" title="Nothing here." />
          : (
            <div className="panel" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Content</th>
                    <th>Author</th>
                    {kind === 'questions' && <th>Status</th>}
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const title = kind === 'questions' ? item.title : item.question?.title
                    const slug = kind === 'questions' ? item.slug : item.question?.slug
                    const type = kind === 'questions' ? 'question' : 'answer'
                    const isHidden = kind === 'questions' ? item.status === 'hidden' : item.status === 'hidden'
                    return (
                      <tr key={item.id}>
                        <td style={{ maxWidth: 340 }}>
                          {slug
                            ? <a href={`/questions/${slug}`} target="_blank" rel="noreferrer">{title}</a>
                            : title}
                          {kind === 'answers' && <div className="muted" style={{ fontSize: '0.8rem' }}>{item.excerpt}</div>}
                        </td>
                        <td>{item.user?.name ?? '—'}</td>
                        {kind === 'questions' && <td>{item.status}</td>}
                        <td className="muted">{timeAgo(item.created_at)}</td>
                        <td>
                          <div className="row" style={{ gap: 4 }}>
                            {isHidden
                              ? <button className="btn btn--ghost btn--sm" onClick={() => act('restore', { type, id: item.id })}>Restore</button>
                              : <button className="btn btn--ghost btn--sm" onClick={() => act('hide', { type, id: item.id, reason: 'Moderation: hidden' })}>Hide</button>}
                            <button className="btn btn--danger btn--sm" onClick={() => {
                              if (window.confirm('Delete this content permanently?')) act('delete', { type, id: item.id, reason: 'Deleted by moderation' })
                            }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </AdminHeader>
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
  }, [load])

  const action = async (path: string, body?: Record<string, unknown>) => {
    try {
      await api.post(path, body)
      load()
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div>
      <AdminHeader title="Users">
        <input className="input" style={{ width: 240 }} placeholder="Search name, username or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </AdminHeader>

      {loading
        ? <Spinner />
        : (
          <div className="panel" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Rep</th>
                  <th>Q / A</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="row">
                        <Avatar name={u.name} path={u.avatar_path} size="sm" />
                        <span>
                          <a href={`/users/${u.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{u.name}</a>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>{u.email}</div>
                        </span>
                      </div>
                    </td>
                    <td>
                      {me?.role === 'admin'
                        ? (
                          <select
                            className="select"
                            style={{ width: 110, padding: '0.25rem' }}
                            value={u.role}
                            onChange={(e) => action(`/admin/users/${u.id}/role`, { role: e.target.value })}
                            aria-label={`Role for ${u.name}`}
                          >
                            <option value="user">user</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                          </select>
                        )
                        : u.role}
                    </td>
                    <td>{formatNumber(u.reputation)}</td>
                    <td className="muted">{u.questions_count} / {u.answers_count}</td>
                    <td>
                      {u.is_suspended
                        ? <span style={{ color: 'var(--red-600)' }}>suspended</span>
                        : u.verification
                          ? <span className="verified-chip">{verificationLabels[u.verification] ?? u.verification}</span>
                          : 'active'}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
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
                        {u.is_suspended
                          ? <button className="btn btn--ghost btn--sm" onClick={() => action(`/admin/users/${u.id}/unsuspend`)}>Restore</button>
                          : (
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
        )}
      <Pagination meta={meta} baseUrl="/admin/users" />
    </div>
  )
}