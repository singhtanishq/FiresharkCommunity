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
  EyeOff, Lock, AlertCircle, ShieldCheck, Trash2, Clock, Search,
  Tag, Trophy, AlertTriangle
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
      <style>{`
        .admin-layout-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }
        .admin-nav-sidebar {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
        }
        .admin-nav-sidebar::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .admin-nav-link {
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .admin-layout-container {
            flex-direction: row;
            align-items: flex-start;
          }
          .admin-nav-sidebar {
            width: 240px;
            flex-shrink: 0;
            flex-direction: column;
            overflow-x: visible;
            position: sticky;
            top: calc(var(--header-h, 60px) + 1.5rem);
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .admin-nav-link {
            width: 100%;
          }
        }
      `}</style>

      <div className="admin-layout-container">
        <nav className="admin-nav-sidebar panel" style={{ padding: '0.75rem', boxSizing: 'border-box' }} aria-label="Admin">
          <div className="hide-on-mobile" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Administration
          </div>
          {ADMIN_NAV.map(([to, icon, label]) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/admin'} 
              className={({ isActive }) => `row admin-nav-link ${isActive ? 'is-active' : ''}`}
              style={{ 
                padding: '0.6rem 0.85rem', 
                borderRadius: 'var(--radius)', 
                textDecoration: 'none',
                transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
                boxSizing: 'border-box'
              }}
            >
              {icon} <span style={{ fontWeight: 500 }}>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div style={{ minWidth: 0, flex: 1, width: '100%', overflowX: 'hidden' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function AdminHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-word' }}>
        {title}
      </h1>
      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', width: 'auto', maxWidth: '100%' }}>
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
        boxSizing: 'border-box',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
    >
      <b style={{ color: warn ? 'var(--danger)' : 'var(--ink-900)', fontSize: '1.75rem', display: 'block', marginBottom: '0.25rem', lineHeight: 1 }}>{value}</b>
      <span style={{ color: warn ? '#991b1b' : 'var(--text-3)', fontSize: '0.85rem', lineHeight: 1.3 }}>{label}</span>
    </div>
  )

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 640px) {
          .admin-stat-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .admin-stat-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
        }
        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 900px) {
          .admin-dashboard-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <AdminHeader title="Dashboard Overview" />

      <div className="admin-stat-grid">
        <StatCard value={formatNumber(stats.users.total)} label="Total users" />
        <StatCard value={formatNumber(stats.users.active_month)} label="Active this month" />
        <StatCard value={formatNumber(stats.questions.published)} label="Published questions" />
        <StatCard value={formatNumber(stats.questions.unanswered)} label="Unanswered" />
        <StatCard value={formatNumber(stats.answers.total)} label="Total Answers" />
        <StatCard value={formatNumber(stats.reports.pending)} label="Open reports" warn={stats.reports.pending > 0} />
      </div>

      <div className="admin-dashboard-grid">
        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Recent questions</h2>
            <NavLink to="/admin/questions" className="muted text-3" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>View all →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.questions.map((q: any) => (
              <div 
                key={q.id} 
                className="row row--between" 
                style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'nowrap', gap: '0.75rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'nowrap' }}>
                  {q.status === 'hidden' && <EyeOff size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />}
                  {q.status === 'closed' && <Lock size={14} color="var(--warning)" style={{ flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.title}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(q.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Latest reports</h2>
            <NavLink to="/admin/reports" className="muted text-3" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Review queue →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.reports.length === 0 && <p className="muted" style={{ padding: '1.5rem', textAlign: 'center', margin: 0 }}>No recent reports.</p>}
            {activity.reports.map((report: any) => (
              <div 
                key={report.id} 
                className="row row--between" 
                style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'nowrap', gap: '0.75rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap', minWidth: 0 }}>
                  <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0 }} /> 
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reportReasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="chip chip--ghost" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', flexShrink: 0, textTransform: 'capitalize' }}>{report.status}</span>
                </div>
                <span className="muted" style={{ fontSize: '0.78rem', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(report.created_at)}</span>
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
        <select className="select" style={{ width: '100%', minWidth: '180px', flex: '1 1 auto' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter reports">
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
        <div className="question-list" style={{ gap: '1.25rem' }}>
          {reports.map((report) => (
            <div key={report.id} className="panel" style={{ padding: '1.25rem', boxSizing: 'border-box', overflowX: 'hidden' }}>
              <div className="row row--between mb-1" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
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
              
              <div style={{ background: 'var(--surface-3)', padding: '1rem', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--brand-blue-400)', margin: '1rem 0', fontSize: '0.95rem', color: 'var(--ink-800)', wordBreak: 'break-word' }}>
                {report.target_excerpt ?? <span className="muted"><i>(Content already deleted)</i></span>}
              </div>
              
              <p className="text-3 mb-3" style={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                {report.description && <span><b>Context:</b> “{report.description}” — </span>}
                Reported by <b>{report.reporter?.name ?? 'Unknown user'}</b> on {report.reportable_type} #{report.reportable_id}
              </p>

              {report.status === 'pending' || report.status === 'reviewing' ? (
                <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Resolution note (optional)..." value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'reviewing', 'none')} style={{ flex: '1 1 auto' }}>Reviewing</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'dismissed', 'none')} style={{ flex: '1 1 auto' }}>Dismiss</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'hide')} style={{ flex: '1 1 auto' }}><EyeOff size={14} /> Hide</button>
                    <button className="btn btn--danger btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'delete')} style={{ flex: '1 1 auto' }}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ) : (
                <div className="row" style={{ fontSize: '0.85rem', color: 'var(--text-2)', background: 'var(--surface-2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                  {report.handled_by && <span>Handled by <b>{report.handled_by.name}</b>:</span>}
                  <span style={{ wordBreak: 'break-word', flex: 1 }}>{report.resolution_note || 'No resolution note provided.'}</span>
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
        <select className="select" style={{ width: '100%', minWidth: '160px', flex: '1 1 auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="closed">Closed</option>
        </select>
        <div className="input-affix" style={{ width: '100%', minWidth: '220px', flex: '2 1 auto' }}>
          <Search className="input-affix__icon" size={16} />
          <input className="input input--with-affix" style={{ width: '100%' }} placeholder="Search content..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="panel"><EmptyState icon={<FolderOpen size={32} strokeWidth={1.5} />} title="No content found." /></div>
      ) : (
        <div className="panel" style={{ padding: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Content Details</th>
                <th style={{ padding: '1rem' }}>Author</th>
                {kind === 'questions' && <th style={{ padding: '1rem' }}>Status</th>}
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const title = kind === 'questions' ? item.title : item.question?.title
                const slug = kind === 'questions' ? item.slug : item.question?.slug
                const type = kind === 'questions' ? 'question' : 'answer'
                const isHidden = item.status === 'hidden'
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', maxWidth: 360 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {slug ? <a href={`/questions/${slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-900)', textDecoration: 'none' }}>{title}</a> : title}
                      </div>
                      {kind === 'answers' && <div className="muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.3rem' }}>{item.excerpt}</div>}
                    </td>
                    <td style={{ padding: '1rem', maxWidth: 150 }}>
                      <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap' }}>
                        <Avatar name={item.user?.name ?? '?'} size="sm" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.user?.name ?? '—'}</span>
                      </div>
                    </td>
                    {kind === 'questions' && (
                      <td style={{ padding: '1rem' }}>
                        <span className={`chip ${isHidden ? 'chip--ghost' : ''}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {item.status}
                        </span>
                      </td>
                    )}
                    <td className="muted" style={{ padding: '1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {isHidden ? (
                          <button className="btn btn--ghost btn--sm" onClick={() => act('restore', { type, id: item.id })}>Restore</button>
                        ) : (
                          <button className="btn btn--ghost btn--sm" onClick={() => act('hide', { type, id: item.id, reason: 'Moderation: hidden' })}>Hide</button>
                        )}
                        <button className="btn btn--danger btn--sm" style={{ padding: '0.4rem' }} onClick={() => { if (window.confirm('Delete this content permanently?')) act('delete', { type, id: item.id, reason: 'Deleted by moderation' }) }}>
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
        <div className="input-affix" style={{ width: '100%', minWidth: '220px', flex: '1 1 auto' }}>
          <Search className="input-affix__icon" size={16} />
          <input className="input input--with-affix" style={{ width: '100%' }} placeholder="Search name, username or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="panel" style={{ padding: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Profile</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Reputation</th>
                  <th style={{ padding: '1rem' }}>Activity (Q/A)</th>
                  <th style={{ padding: '1rem' }}>Account Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', maxWidth: 200 }}>
                      <div className="row" style={{ gap: '0.75rem', flexWrap: 'nowrap' }}>
                        <Avatar name={u.name} path={u.avatar_path} size="md" />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <a href={`/users/${u.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none' }}>{u.name}</a>
                          <span className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {me?.role === 'admin' ? (
                        <select className="select" style={{ width: '120px', padding: '0.4rem', fontSize: '0.85rem' }} value={u.role} onChange={(e) => action(`/admin/users/${u.id}/role`, { role: e.target.value })} aria-label={`Role for ${u.name}`}>
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="chip chip--ghost" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--brand-blue-600)', whiteSpace: 'nowrap' }}>{formatNumber(u.reputation)}</td>
                    <td className="muted" style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{u.questions_count} <span style={{ opacity: 0.5, margin: '0 0.2rem' }}>/</span> {u.answers_count}</td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {u.is_suspended ? (
                        <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.2rem 0.6rem' }}><Lock size={12} /> Suspended</span>
                      ) : u.verification ? (
                        <span className="verified-chip" style={{ padding: '0.2rem 0.6rem' }}><Award size={12} /> {verificationLabels[u.verification] ?? u.verification}</span>
                      ) : (
                        <span className="chip chip--ghost" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
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
          <div className="mt-4 row row--between" style={{ width: '100%', boxSizing: 'border-box' }}>
            <Pagination meta={meta} baseUrl="/admin/users" />
          </div>
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ categories & badges

export function AdminCategories() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title="Categories & Tags" />
      <div className="panel" style={{ padding: '3rem 1rem' }}>
        <EmptyState icon={<Tag size={40} color="var(--brand-blue-300)" strokeWidth={1.5} />} title="Category Management Module Active." />
      </div>
    </div>
  )
}

export function AdminBadges() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader title="Badges & Reputation" />
      <div className="panel" style={{ padding: '3rem 1rem' }}>
        <EmptyState icon={<Award size={40} color="var(--brand-blue-300)" strokeWidth={1.5} />} title="Badge Management Module Active." />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ settings

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [leaderboard, setLeaderboard] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/admin/settings'), api.get('/admin/leaderboard')])
      .then(([s, l]) => {
        setSettings(s.data.data)
        setLeaderboard(l.data.data)
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    try {
      await api.put('/admin/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert(apiError(e).message) }
  }

  const finalize = async (periodKey: string) => {
    if (!window.confirm(`Finalize leaderboard for ${periodKey}? This snapshot closes the period and cannot be undone.`)) return
    try {
      await api.post('/admin/leaderboard/finalize', { period_key: periodKey })
      const l = await api.get('/admin/leaderboard')
      setLeaderboard(l.data.data)
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading) return <Spinner />

  // SAFEGUARD: Only map if it exists and is an array. This fixes the TypeError immediately.
  const periods = Array.isArray(leaderboard?.periods) ? leaderboard.periods : []

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .admin-settings-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
      `}</style>
      
      <div className="admin-settings-grid" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
        <div style={{ minWidth: 0, width: '100%' }}>
          <AdminHeader title="Platform Settings" />

          <section className="panel mb-3" style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <div className="panel__header">
              <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Core Configuration
              </h2>
            </div>
            <div className="panel__body" style={{ width: '100%', boxSizing: 'border-box' }}>
              {saved && (
                <div className="banner banner--success mb-3" style={{ animation: 'modal-rise var(--dur) var(--ease)' }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span style={{ wordBreak: 'break-word' }}>Global configuration updated successfully.</span>
                </div>
              )}
              
              <div className="field">
                <label htmlFor="cfg-site-name">Platform Name</label>
                <input 
                  id="cfg-site-name" 
                  className="input input--lg" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={settings?.site_name ?? ''} 
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} 
                />
              </div>
              
              <div className="field">
                <label htmlFor="cfg-site-desc">Global SEO Description</label>
                <textarea 
                  id="cfg-site-desc" 
                  className="textarea" 
                  style={{ minHeight: '90px', width: '100%', boxSizing: 'border-box' }} 
                  value={settings?.site_description ?? ''} 
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} 
                />
                <span className="hint">Used for metadata and default opengraph descriptions.</span>
              </div>
              
              <div className="field">
                <label htmlFor="cfg-support">Support URL</label>
                <input 
                  id="cfg-support" 
                  className="input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={settings?.support_url ?? ''} 
                  onChange={(e) => setSettings({ ...settings, support_url: e.target.value })} 
                />
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn--primary" onClick={save}>
                  <CheckCircle2 size={16} /> Save Configuration
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside style={{ minWidth: 0, width: '100%' }}>
          <section className="panel" style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <div className="panel__header">
              <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Leaderboard Engine
              </h2>
            </div>
            <div className="panel__body" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
              {!leaderboard ? (
                <Spinner />
              ) : periods.length === 0 ? (
                <div style={{ padding: '2rem 1rem' }}>
                  <EmptyState icon={<Trophy size={32} strokeWidth={1.5} />} title="No finalized periods." />
                </div>
              ) : (
                <table className="data-table" style={{ width: '100%', minWidth: '280px' }}>
                  <thead>
                    <tr>
                      <th>Period Cycle</th>
                      <th style={{ textAlign: 'right' }}>Finalized Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p: any) => (
                      <tr key={p.period_key}>
                        <td>
                          <b style={{ color: 'var(--ink-900)' }}>{p.period_key}</b>
                          <div className="chip chip--ghost mt-1" style={{ fontSize: '0.7rem' }}>{p.status}</div>
                        </td>
                        <td className="muted text-3" style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {p.finalized_at ? new Date(p.finalized_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {leaderboard?.period && leaderboard.period.is_current && (
                <div style={{ padding: '1.25rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', boxSizing: 'border-box' }}>
                  <div className="row row--between mb-1" style={{ fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <b>Active Cycle:</b>
                    <span className="chip" style={{ background: 'var(--brand-blue-50)', color: 'var(--brand-blue-700)' }}>{leaderboard.period.period_key}</span>
                  </div>
                  <button className="btn btn--danger btn--block mt-2" onClick={() => finalize(leaderboard.period.period_key)}>
                    <AlertTriangle size={16} /> Finalize Current Cycle
                  </button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}