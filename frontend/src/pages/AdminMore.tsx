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
  Menu, X, Tag, Trophy, TrendingUp, Plus, Save, AlertTriangle, Check, Terminal
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
              style={{ all: 'unset', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-3)' }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="admin-nav-list" role="navigation">
          {navItems.map(([to, icon, label]) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/admin'} 
              className={({ isActive }) => `row ${isActive ? 'is-active' : ''}`}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span> 
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile menu button */}
      {window.innerWidth < 1024 && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="admin-mobile-menu-btn"
          aria-label="Open admin menu"
        >
          <Menu size={24} />
        </button>
      )}

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="page-header" style={{ 
      padding: '1.5rem 0', 
      marginBottom: '1.5rem', 
      borderBottom: '1px solid var(--border)',
      display: 'flex', 
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.95rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------- Categories

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/categories')
      .then((c) => setCategories(c.data.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const createCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await api.post('/admin/categories', { name: newCategory })
      setNewCategory('')
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  const saveCategory = async (category: any) => {
    try {
      await api.put(`/admin/categories/${category.id}`, category)
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  const deleteCategory = async (category: any) => {
    try {
      await api.delete(`/admin/categories/${category.id}`)
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading && categories.length === 0) return <Spinner />

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
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
        title="Categories" 
        subtitle="Manage question categories and their visibility"
      />

      <section className="panel mb-3">
        <div className="panel__header">
          <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderTree size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Categories
          </h2>
        </div>
        <div className="panel__body" style={{ padding: 0, width: '100%' }}>
          <div className="admin-table-wrapper">
            <table className="data-table" style={{ minWidth: '650px' }}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>URL Slug</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} style={{ transition: 'background var(--dur) var(--ease)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td>
                      <input
                        className="input" style={{ width: '100%', maxWidth: '220px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        value={category.name}
                        onChange={(e) => setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))}
                        aria-label="Category name"
                      />
                    </td>
                    <td className="muted font-mono text-3" style={{ whiteSpace: 'nowrap' }}>{category.slug}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatNumber(category.questions_count)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label className="row" style={{ gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', userSelect: 'none', flexWrap: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={category.is_active}
                          onChange={(e) => setCategories(categories.map((c) => (c.id === category.id ? { ...c, is_active: e.target.checked } : c)))}
                          style={{ accentColor: 'var(--brand-blue-600)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span className={category.is_active ? 'text-primary' : 'muted'}>{category.is_active ? 'Active' : 'Hidden'}</span>
                      </label>
                    </td>
                    <td>
                      <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => saveCategory(category)} title="Save changes"><Save size={16} /></button>
                        <button className="btn btn--danger btn--sm" style={{ padding: '0.4rem' }} onClick={() => { if (window.confirm('Delete this category?')) deleteCategory(category) }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <input className="input input--sm" style={{ flex: '1 1 200px', maxWidth: '300px', padding: '0.5rem 0.75rem' }} placeholder="New category name..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button className="btn btn--primary btn--sm" onClick={createCategory} disabled={!newCategory.trim()} style={{ flexShrink: 0, padding: '0.5rem 1rem' }}>
              <Plus size={16} style={{ marginRight: '0.3rem' }} /> Add Category
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------- Tags

export function AdminTags() {
  const [tags, setTags] = useState<any[]>([])
  const [tagQ, setTagQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/tags', { params: { per_page: 40, q: tagQ || undefined } })
      .then((t) => setTags(t.data.data))
      .finally(() => setLoading(false))
  }, [tagQ])

  useEffect(load, [load])

  const saveTag = async (tag: any) => {
    try {
      await api.put(`/admin/tags/${tag.id}`, { name: tag.name, description: tag.description })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  const mergeTag = async (tag: any) => {
    const targetId = window.prompt(`Merge "${tag.name}" into which tag id? (see ids in the table)`)
    if (!targetId) return
    try {
      await api.post(`/admin/tags/${tag.id}/merge`, { target_id: Number(targetId) })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading && tags.length === 0) return <Spinner />

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
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
        title="Tags" 
        subtitle="Manage system tags and their usage"
      >
        <div className="input-affix" style={{ width: '100%', maxWidth: '260px', position: 'relative' }}>
          <Search className="input-affix__icon" size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input input--with-affix" style={{ padding: '0.5rem 0.6rem 0.5rem 2.2rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }} placeholder="Search tags…" value={tagQ} onChange={(e) => setTagQ(e.target.value)} />
        </div>
      </AdminHeader>

      <section className="panel mb-3">
        <div className="panel__header">
          <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tags size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> System Tags
          </h2>
        </div>
        <div className="panel__body" style={{ padding: 0, width: '100%' }}>
          <div className="admin-table-wrapper">
            <table className="data-table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ID</th>
                  <th>Tag Name</th>
                  <th>Description</th>
                  <th>Usage Count</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} style={{ transition: 'background var(--dur) var(--ease)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="muted font-mono text-3" style={{ whiteSpace: 'nowrap' }}>#{tag.id}</td>
                    <td>
                      <input
                        className="input" style={{ width: '100%', maxWidth: '200px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        defaultValue={tag.name}
                        onBlur={(e) => {
                          if (e.target.value !== tag.name) saveTag({ ...tag, name: e.target.value })
                        }}
                        aria-label="Tag name"
                      />
                    </td>
                    <td>
                      <input
                        className="input" style={{ width: '100%', minWidth: '200px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        defaultValue={tag.description ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (tag.description ?? '')) saveTag({ ...tag, description: e.target.value })
                        }}
                        aria-label="Tag description"
                        placeholder="Add description..."
                      />
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatNumber(tag.questions_count)}</td>
                    <td>
                      <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => mergeTag(tag)}>Merge Into…</button>
                        <button className="btn btn--danger btn--sm" style={{ padding: '0.4rem' }} onClick={() => { if (window.confirm('Delete this tag permanently?')) api.delete(`/admin/tags/${tag.id}`).then(load).catch((e) => alert(apiError(e).message)) }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------- Badges

export function AdminBadges() {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/badges')
      .then((b) => setBadges(b.data.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const awardBadge = async (badge: any) => {
    const username = window.prompt(`Manually award "${badge.name}" to username:`)
    if (!username) return
    try {
      await api.post(`/admin/badges/${badge.id}/award`, { username })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading) return <Spinner />

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
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
        title="Badges" 
        subtitle="Manage community badges and manual awards"
      />

      <section className="panel mb-3">
        <div className="panel__header">
          <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Community Badges
          </h2>
        </div>
        <div className="panel__body" style={{ padding: 0, width: '100%' }}>
          <div className="admin-table-wrapper">
            <table className="data-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Badge Details</th>
                  <th>Tier</th>
                  <th>Award Type</th>
                  <th>Unlock Criteria</th>
                  <th>Holders</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {badges.map((badge) => (
                  <tr key={badge.id} style={{ transition: 'background var(--dur) var(--ease)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ maxWidth: '280px' }}>
                      <b style={{ color: 'var(--ink-900)', fontSize: '0.95rem' }}>{badge.name}</b>
                      <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem', wordBreak: 'break-word', lineHeight: 1.4 }}>{badge.description}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="chip" style={{ 
                        background: badge.tier === 'gold' ? '#fef3c7' : badge.tier === 'silver' ? '#f1f5f9' : '#ffedd5',
                        color: badge.tier === 'gold' ? '#b45309' : badge.tier === 'silver' ? '#475569' : '#9a3412',
                        textTransform: 'capitalize', fontWeight: 700, padding: '0.2rem 0.6rem', fontSize: '0.8rem'
                      }}>
                        {badge.tier}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{badge.award_type}</td>
                    <td className="muted font-mono text-3" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{badge.criteria ? `${badge.criteria.type} ≥ ${badge.criteria.count}` : 'Manual'}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.95rem' }}>{formatNumber(badge.awarded_count)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => awardBadge(badge)}>Award Manually…</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------- Reputation

export function AdminReputation() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/reputation-rules')
      .then((r) => setRules(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const saveRule = async (rule: any) => {
    try {
      await api.put(`/admin/reputation-rules/${rule.id}`, { points: Number(rule.points), is_enabled: rule.is_enabled })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading) return <Spinner />

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
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
        title="Reputation Rules" 
        subtitle="Configure reputation points for user actions"
      />

      <section className="panel mb-3">
        <div className="panel__header">
          <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Reputation Rules
          </h2>
        </div>
        <div className="panel__body" style={{ padding: 0, width: '100%' }}>
          <div className="admin-table-wrapper">
            <table className="data-table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Action Trigger</th>
                  <th>Points Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} style={{ transition: 'background var(--dur) var(--ease)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ minWidth: '220px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink-900)', display: 'block', marginBottom: '0.3rem', fontSize: '0.95rem' }}>{rule.label}</span>
                      <span className="chip chip--ghost" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{rule.action}</span>
                    </td>
                    <td>
                      <input
                        className="input" style={{ width: '100px', padding: '0.5rem 0.6rem', fontWeight: 700, color: 'var(--brand-blue-700)', fontSize: '0.95rem', boxSizing: 'border-box' }} type="number"
                        value={rule.points}
                        onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, points: e.target.value } : r)))}
                        aria-label="Points"
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <label className="row" style={{ gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', userSelect: 'none', flexWrap: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={rule.is_enabled}
                          onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, is_enabled: e.target.checked } : r)))}
                          style={{ accentColor: 'var(--brand-blue-600)', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span className={rule.is_enabled ? 'text-primary font-medium' : 'muted'}>{rule.is_enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => saveRule(rule)}><Save size={16} style={{ marginRight: '4px' }} /> Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------- Settings & Leaderboard

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

              {/* Professional dark code snippet block for configuration viewing */}
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
              {periods.length === 0 ? (
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