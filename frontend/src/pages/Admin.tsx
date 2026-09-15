import { useCallback, useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
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
  Menu, X, Tag, Trophy, Terminal
} from 'lucide-react'

// ------------------------------------------------------------------ shell

const ADMIN_NAV = [
  ['/admin', <LayoutDashboard size={18} strokeWidth={2} />, 'Dashboard'],
  ['/admin/reports', <Flag size={18} strokeWidth={2} />, 'Reports'],
  ['/admin/questions', <MessageSquare size={18} strokeWidth={2} />, 'Questions'],
  ['/admin/answers', <FileText size={18} strokeWidth={2} />, 'Answers'],
  ['/admin/users', <Users size={18} strokeWidth={2} />, 'Users'],
  ['/admin/categories', <FolderOpen size={18} strokeWidth={2} />, 'Categories'],
  ['/admin/tags', <Tag size={18} strokeWidth={2} />, 'Tags'],
  ['/admin/badges', <Award size={18} strokeWidth={2} />, 'Badges'],
  ['/admin/reputation', <Trophy size={18} strokeWidth={2} />, 'Reputation'],
  ['/admin/settings', <Settings size={18} strokeWidth={2} />, 'Settings & Config'],
] as const

// Separate nav for moderators (no settings)
const MODERATOR_NAV = [
  ['/admin', <LayoutDashboard size={18} strokeWidth={2} />, 'Dashboard'],
  ['/admin/reports', <Flag size={18} strokeWidth={2} />, 'Reports'],
  ['/admin/questions', <MessageSquare size={18} strokeWidth={2} />, 'Questions'],
  ['/admin/answers', <FileText size={18} strokeWidth={2} />, 'Answers'],
  ['/admin/users', <Users size={18} strokeWidth={2} />, 'Users'],
] as const

export function AdminLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/" replace />

  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : MODERATOR_NAV

  return (
    <div className="admin-layout" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
      <style>{`
        .admin-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: var(--container, 1400px);
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
        }
        
        .admin-main {
          flex: 1;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 1rem;
        }

        .admin-nav {
          background: var(--surface);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          z-index: 50;
        }

        .admin-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
        }

        .admin-nav-list {
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          gap: 0.25rem;
          overflow-y: auto;
        }

        .admin-nav-list a {
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--ink-800);
          transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .admin-nav-list a:hover {
          background: var(--surface-2);
        }

        /* Fixed Icon Colors */
        .admin-nav-list a svg {
          color: var(--text-3);
          transition: color var(--dur) var(--ease);
        }

        .admin-nav-list a.is-active {
          background: var(--brand-blue-50);
          color: var(--brand-blue-700);
          font-weight: 600;
        }
        
        .admin-nav-list a.is-active svg {
          color: var(--brand-blue-700);
        }

        .admin-mobile-menu-btn {
          display: none;
        }

        /* Desktop Layout (1024px+) */
        @media (min-width: 1024px) {
          .admin-layout {
            flex-direction: row;
            align-items: flex-start;
            padding: 1.5rem 1rem;
            gap: 2rem;
          }
          .admin-nav {
            width: 250px;
            flex-shrink: 0;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            position: sticky;
            top: calc(var(--header-h, 70px) + 1.5rem);
          }
          .admin-nav-header {
            border-bottom: none;
            padding: 1.25rem 1rem 0.5rem;
          }
          .admin-main {
            padding: 0;
          }
        }

        /* Mobile Layout (< 1024px) */
        @media (max-width: 1023px) {
          .admin-mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: var(--brand-blue-600);
            color: #fff;
            border: none;
            box-shadow: 0 4px 14px rgba(22, 122, 201, 0.4);
            z-index: 40;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .admin-mobile-menu-btn:active {
            transform: scale(0.95);
          }
          .admin-nav {
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100vh;
            border-right: 1px solid var(--border);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform: translateX(0);
          }
          .admin-nav.is-open {
            transform: translateX(280px);
            box-shadow: var(--shadow-xl);
          }
          .admin-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(11, 18, 32, 0.6);
            backdrop-filter: blur(2px);
            z-index: 45;
            animation: fade-in 0.3s ease forwards;
          }
        }
      `}</style>

      {/* Mobile sidebar overlay */}
      {window.innerWidth < 1024 && sidebarOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav 
        className={`admin-nav ${window.innerWidth < 1024 && sidebarOpen ? 'is-open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-nav-header">
          <span>Administration</span>
          {window.innerWidth < 1024 && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ all: 'unset', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-3)', display: 'grid', placeItems: 'center' }}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="admin-nav-list" role="navigation">
          {navItems.map(([to, icon, label]) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/admin'} 
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span> 
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="admin-mobile-menu-btn"
        aria-label="Open admin menu"
      >
        <Menu size={24} />
      </button>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="page-header" style={{ 
      padding: '0 0 1.5rem', 
      marginBottom: '1.5rem', 
      borderBottom: '1px solid var(--border)',
      display: 'flex', 
      flexDirection: 'column',
      gap: '1rem',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', margin: 0, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.95rem', wordBreak: 'break-word' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
          {children}
        </div>
      )}
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
      className={`panel stat-card ${warn ? 'warn' : ''}`}
      style={{
        padding: '1.25rem 1rem',
        border: warn ? '1px solid var(--danger)' : '1px solid var(--border)',
        background: warn ? 'var(--danger-bg)' : 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
    >
      <b style={{ fontSize: '1.75rem', color: warn ? 'var(--danger)' : 'var(--ink-900)', lineHeight: 1.2 }}>{value}</b>
      <span style={{ fontSize: '0.85rem', color: warn ? '#991b1b' : 'var(--text-3)' }}>{label}</span>
    </div>
  )

  return (
    <div className="admin-content" style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 640px) {
          .admin-stat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1200px) {
          .admin-stat-grid { grid-template-columns: repeat(6, 1fr); }
        }

        .admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .admin-grid-2 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <AdminHeader 
        title="Dashboard Overview" 
        subtitle="Platform statistics and recent activity"
      />

      <div className="admin-stat-grid">
        <StatCard value={formatNumber(stats.users.total)} label="Total users" />
        <StatCard value={formatNumber(stats.users.active_month)} label="Active this month" />
        <StatCard value={formatNumber(stats.questions.published)} label="Published questions" />
        <StatCard value={formatNumber(stats.questions.unanswered)} label="Unanswered" />
        <StatCard value={formatNumber(stats.answers.total)} label="Total Answers" />
        <StatCard value={formatNumber(stats.reports.pending)} label="Open reports" warn={stats.reports.pending > 0} />
      </div>

      <div className="admin-grid-2">
        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Recent questions</h2>
            <NavLink to="/admin/questions" className="muted text-3" style={{ fontSize: '0.85rem' }}>View all →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.questions.map((q: any) => (
              <div 
                key={q.id} 
                className="row row--between" 
                style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'nowrap', gap: '0.75rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'nowrap' }}>
                  {q.status === 'hidden' && <EyeOff size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />}
                  {q.status === 'closed' && <Lock size={14} color="var(--warning)" style={{ flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {q.title}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(q.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ overflowX: 'hidden' }}>
          <div className="panel__header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Latest reports</h2>
            <NavLink to="/admin/reports" className="muted text-3" style={{ fontSize: '0.85rem' }}>Review queue →</NavLink>
          </div>
          <div className="panel__body" style={{ padding: 0 }}>
            {activity.reports.length === 0 && <p className="muted" style={{ padding: '2rem', textAlign: 'center', margin: 0, fontSize: '0.95rem' }}>No recent reports.</p>}
            {activity.reports.map((report: any) => (
              <div 
                key={report.id} 
                className="row row--between" 
                style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', transition: 'background var(--dur) var(--ease)', flexWrap: 'nowrap', gap: '0.75rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="row" style={{ gap: '0.5rem', flexWrap: 'nowrap', minWidth: 0 }}>
                  <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0 }} /> 
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reportReasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="chip chip--ghost" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', flexShrink: 0, textTransform: 'capitalize' }}>{report.status}</span>
                </div>
                <span className="muted" style={{ fontSize: '0.8rem', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(report.created_at)}</span>
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
    <div className="admin-content" style={{ width: '100%', boxSizing: 'border-box' }}>
      <AdminHeader 
        title="Moderation Queue" 
        subtitle="Review and take action on reported content"
      >
        <select className="select" style={{ width: '100%', maxWidth: '200px', padding: '0.5rem 1rem' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter reports">
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
        <div className="panel" style={{ padding: '4rem 2rem' }}>
          <EmptyState icon={<ShieldCheck size={48} color="var(--success)" strokeWidth={1.5} />} title="Queue is empty. Great job." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reports.map((report) => (
            <div key={report.id} className="panel" style={{ padding: '1.25rem', overflowX: 'hidden' }}>
              <div className="row row--between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`chip ${report.status === 'pending' ? '' : 'chip--ghost'}`} style={{ flexShrink: 0, padding: '0.2rem 0.6rem', fontSize: '0.85rem' }}>
                    {reportReasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className="text-3 muted row" style={{ gap: '0.4rem', flexShrink: 0, fontSize: '0.85rem' }}>
                    <Clock size={14} /> {timeAgo(report.created_at)}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: report.status === 'pending' ? 'var(--warning)' : 'var(--text-3)', flexShrink: 0 }}>
                  {report.status}
                </span>
              </div>
              
              <div style={{ background: 'var(--surface-3)', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--brand-blue-400)', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--ink-800)', wordBreak: 'break-word', lineHeight: 1.5 }}>
                {report.target_excerpt ?? <span className="muted"><i>(Content already deleted)</i></span>}
              </div>
              
              <p className="text-3" style={{ wordBreak: 'break-word', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {report.description && <span><b>Context:</b> “{report.description}” — </span>}
                Reported by <b style={{ color: 'var(--ink-900)' }}>{report.reporter?.name ?? 'Unknown user'}</b> on {report.reportable_type} #{report.reportable_id}
              </p>

              {report.status === 'pending' || report.status === 'reviewing' ? (
                <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input className="input input--sm" style={{ width: '100%', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }} placeholder="Resolution note (optional)..." value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'reviewing', 'none')} style={{ flex: '1 1 auto', justifyContent: 'center' }}>Reviewing</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'dismissed', 'none')} style={{ flex: '1 1 auto', justifyContent: 'center' }}>Dismiss</button>
                    <button className="btn btn--ghost btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'hide')} style={{ flex: '1 1 auto', justifyContent: 'center' }}><EyeOff size={16} style={{ marginRight: '4px' }} /> Hide</button>
                    <button className="btn btn--danger btn--sm" disabled={busyId === report.id} onClick={() => resolve(report.id, 'resolved', 'delete')} style={{ flex: '1 1 auto', justifyContent: 'center' }}><Trash2 size={16} style={{ marginRight: '4px' }} /> Delete</button>
                  </div>
                </div>
              ) : (
                <div className="row" style={{ fontSize: '0.9rem', color: 'var(--text-2)', background: 'var(--surface-2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                  {report.handled_by && <span>Handled by <b style={{ color: 'var(--ink-900)' }}>{report.handled_by.name}</b>:</span>}
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
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 })

  const load = useCallback((page = 1) => {
    setLoading(true)
    api.get(`/admin/${kind}`, { params: { status: statusFilter || undefined, q: q || undefined, page, per_page: 20 } })
      .then((r) => {
        setItems(r.data.data)
        setMeta(r.data.meta)
      })
      .finally(() => setLoading(false))
  }, [kind, statusFilter, q])

  useEffect(() => {
    const t = setTimeout(() => load(1), q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const act = async (action: string, body: Record<string, unknown>) => {
    try {
      await api.post(`/admin/content/${action}`, body)
      load(meta.current_page)
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div className="admin-content" style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: var(--surface);
        }
        .admin-table-wrapper table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
        }
        .admin-table-wrapper th {
          background: var(--surface-2);
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
          color: var(--text-3);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .admin-table-wrapper td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .admin-table-wrapper tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      <AdminHeader 
        title={kind === 'questions' ? 'Questions Library' : 'Answers Library'} 
        subtitle={kind === 'questions' ? 'Manage and moderate all questions' : 'Manage and moderate all answers'}
      >
        <select className="select" style={{ width: '100%', maxWidth: '200px', padding: '0.5rem 1rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="closed">Closed</option>
        </select>
        <div className="input-affix" style={{ width: '100%', maxWidth: '300px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input input--with-affix" style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem', boxSizing: 'border-box' }} placeholder="Search content..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="panel" style={{ padding: '4rem 2rem' }}>
          <EmptyState icon={<FolderOpen size={48} strokeWidth={1.5} />} title="No content found." />
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table>
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
                      <td style={{ maxWidth: 350 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {slug ? <a href={`/questions/${slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-blue-600)', textDecoration: 'none' }}>{title}</a> : title}
                        </div>
                        {kind === 'answers' && <div className="muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.3rem' }}>{item.excerpt}</div>}
                      </td>
                      <td>
                        <div className="row" style={{ gap: '0.75rem', flexWrap: 'nowrap' }}>
                          <Avatar name={item.user?.name ?? '?'} size="sm" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.user?.name ?? '—'}</span>
                        </div>
                      </td>
                      {kind === 'questions' && (
                        <td>
                          <span className={`chip ${isHidden ? 'chip--ghost' : ''}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {item.status}
                          </span>
                        </td>
                      )}
                      <td className="muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {isHidden ? (
                            <button className="btn btn--ghost btn--sm" onClick={() => act('restore', { type, id: item.id })}>Restore</button>
                          ) : (
                            <button className="btn btn--ghost btn--sm" onClick={() => act('hide', { type, id: item.id, reason: 'Moderation: hidden' })}>Hide</button>
                          )}
                          <button className="btn btn--danger btn--sm" style={{ padding: '0.4rem 0.6rem' }} onClick={() => { if (window.confirm('Delete this content permanently?')) act('delete', { type, id: item.id, reason: 'Deleted by moderation' }) }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {meta.last_page > 1 && (
            <div className="mt-4" style={{ width: '100%', boxSizing: 'border-box' }}>
              <Pagination meta={meta} baseUrl={`/admin/${kind}`} />
            </div>
          )}
        </>
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
    <div className="admin-content" style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: var(--surface);
        }
        .admin-table-wrapper table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }
        .admin-table-wrapper th {
          background: var(--surface-2);
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
          color: var(--text-3);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .admin-table-wrapper td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .admin-table-wrapper tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      <AdminHeader 
        title="User Directory" 
        subtitle="Manage user accounts, roles, and verifications"
      >
        <div className="input-affix" style={{ width: '100%', maxWidth: '320px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input input--with-affix" style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem', boxSizing: 'border-box' }} placeholder="Search name, username or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </AdminHeader>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table>
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
                    <td style={{ maxWidth: 220 }}>
                      <div className="row" style={{ gap: '1rem', flexWrap: 'nowrap' }}>
                        <Avatar name={u.name} path={u.avatar_path} size="md" />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '0.2rem' }}>
                          <a href={`/users/${u.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none' }}>{u.name}</a>
                          <span className="muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {me?.role === 'admin' ? (
                        <select className="select" style={{ width: '130px', padding: '0.4rem 0.5rem', fontSize: '0.9rem' }} value={u.role} onChange={(e) => action(`/admin/users/${u.id}/role`, { role: e.target.value })} aria-label={`Role for ${u.name}`}>
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="chip chip--ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>{u.role}</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-blue-600)', whiteSpace: 'nowrap', fontSize: '1rem' }}>{formatNumber(u.reputation)}</td>
                    <td className="muted" style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{u.questions_count} <span style={{ opacity: 0.5, margin: '0 0.25rem' }}>/</span> {u.answers_count}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {u.is_suspended ? (
                        <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}><Lock size={14} style={{ marginRight: '4px' }} /> Suspended</span>
                      ) : u.verification ? (
                        <span className="verified-chip" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}><Award size={14} style={{ marginRight: '4px' }} /> {verificationLabels[u.verification] ?? u.verification}</span>
                      ) : (
                        <span className="chip chip--ghost" style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}>Active</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {me?.role === 'admin' && (
                          <>
                            <button className="btn btn--ghost btn--sm" onClick={() => {
                              const type = window.prompt('Verification type: team, expert, alumni, professional')
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
          <div className="mt-4" style={{ width: '100%', boxSizing: 'border-box' }}>
            <Pagination meta={meta} baseUrl="/admin/users" />
          </div>
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Settings

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [leaderboard, setLeaderboard] = useState<any>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/admin/settings'), api.get('/admin/leaderboard')])
      .then(([s, l]) => {
        setSettings(s.data.data)
        setLeaderboard(l.data.data)
      })
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

  // Helper to safely access periods array
  const periods = Array.isArray(leaderboard?.periods) ? leaderboard.periods : []
  const currentPeriod = leaderboard?.current

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
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
      
      <AdminHeader 
        title="Settings & Config" 
        subtitle="Platform configuration and leaderboard management"
      />

      <div className="admin-settings-grid">
        <div style={{ width: '100%', minWidth: 0 }}>
          <section className="panel mb-3" style={{ overflowX: 'hidden' }}>
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
                  value={settings.site_name ?? ''} 
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} 
                />
              </div>
              
              <div className="field">
                <label htmlFor="cfg-site-desc">Global SEO Description</label>
                <textarea 
                  id="cfg-site-desc" 
                  className="textarea" 
                  style={{ minHeight: '100px', width: '100%', boxSizing: 'border-box' }} 
                  value={settings.site_description ?? ''} 
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
                  value={settings.support_url ?? ''} 
                  onChange={(e) => setSettings({ ...settings, support_url: e.target.value })} 
                />
              </div>

              {/* Replaced nested grey box with professional dark code snippet block */}
              <div className="field" style={{ marginTop: '1.5rem' }}>
                <label>System Environment Config</label>
                <div style={{ background: '#0b1220', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Terminal size={14} color="#94a3b8" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>system_config.json</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.5 }}>
                    {JSON.stringify(settings || { message: "No generic configuration loaded." }, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn--primary" onClick={save}>
                  <Check size={16} style={{ marginRight: '4px' }} /> Save Configuration
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside style={{ width: '100%', minWidth: 0 }}>
          <section className="panel" style={{ overflowX: 'hidden' }}>
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
                <table className="data-table" style={{ width: '100%', minWidth: '320px' }}>
                  <thead>
                    <tr>
                      <th>Period Cycle</th>
                      <th style={{ textAlign: 'right' }}>Finalized Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p: any) => (
                      <tr key={p.period_key}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <b style={{ color: 'var(--ink-900)', fontSize: '0.95rem' }}>{p.period_key}</b>
                          <div className="chip chip--ghost mt-1" style={{ fontSize: '0.7rem', display: 'inline-block' }}>{p.status}</div>
                        </td>
                        <td className="muted text-3" style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap', padding: '0.75rem 1rem' }}>
                          {p.finalized_at ? new Date(p.finalized_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {currentPeriod && (
                <div style={{ padding: '1.5rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', boxSizing: 'border-box' }}>
                  <div className="row row--between mb-2" style={{ fontSize: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <b style={{ color: 'var(--ink-900)' }}>Active Cycle:</b>
                    <span className="chip" style={{ background: 'var(--brand-blue-50)', color: 'var(--brand-blue-700)', padding: '0.2rem 0.6rem' }}>Current Month</span>
                  </div>
                  <p className="muted text-3 mb-3" style={{ lineHeight: 1.5, wordBreak: 'break-word' }}>The current month's leaderboard is live and updates in real-time. Finalize to snapshot it.</p>
                  <button className="btn btn--danger btn--block" onClick={() => finalize(currentPeriod.period_key ?? new Date().toISOString().slice(0, 7))}>
                    <AlertTriangle size={16} style={{ marginRight: '4px' }} /> Finalize Current Month
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