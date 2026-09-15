import { useCallback, useEffect, useState } from 'react'
import { api, apiError } from '../api/client'
import { AdminHeader } from './Admin'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { 
  FolderTree, Tags, Search, Plus, Save, 
  Trash2, Award, TrendingUp, Settings, CheckCircle2,
  AlertTriangle, Check, Trophy
} from 'lucide-react'

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
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
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
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
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
                      className="input" style={{ width: '220px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      value={category.name}
                      onChange={(e) => setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))}
                      aria-label="Category name"
                    />
                  </td>
                  <td className="muted font-mono text-3" style={{ whiteSpace: 'nowrap' }}>{category.slug}</td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatNumber(category.questions_count)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <label className="row" style={{ gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', userSelect: 'none', flexWrap: 'nowrap' }}>
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
                    <div className="row" style={{ gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => saveCategory(category)} title="Save changes"><Save size={14} /></button>
                      <button className="btn btn--danger btn--sm" style={{ padding: '0.36rem' }} onClick={() => { if (window.confirm('Delete this category?')) deleteCategory(category) }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ padding: '1rem 1.15rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <input className="input input--sm" style={{ flex: '1 1 200px', maxWidth: '260px' }} placeholder="New category name..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button className="btn btn--primary btn--sm" onClick={createCategory} disabled={!newCategory.trim()} style={{ flexShrink: 0 }}>
              <Plus size={14} /> Add Category
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
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
      <AdminHeader 
        title="Tags" 
        subtitle="Manage system tags and their usage"
      >
        <div className="input-affix" style={{ width: '100%', maxWidth: '220px', position: 'relative' }}>
          <Search className="input-affix__icon" size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.6rem' }} />
          <input className="input input--with-affix" style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }} placeholder="Search tags…" value={tagQ} onChange={(e) => setTagQ(e.target.value)} />
        </div>
      </AdminHeader>

      <section className="panel mb-3">
        <div className="panel__header">
          <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tags size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> System Tags
          </h2>
        </div>
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '500px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
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
                      className="input" style={{ width: '200px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      defaultValue={tag.name}
                      onBlur={(e) => {
                        if (e.target.value !== tag.name) saveTag({ ...tag, name: e.target.value })
                      }}
                      aria-label="Tag name"
                    />
                  </td>
                  <td>
                    <input
                      className="input" style={{ width: '200px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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
                    <div className="row" style={{ gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => mergeTag(tag)}>Merge Into…</button>
                      <button className="btn btn--danger btn--sm" style={{ padding: '0.36rem' }} onClick={() => { if (window.confirm('Delete this tag permanently?')) api.delete(`/admin/tags/${tag.id}`).then(load).catch((e) => alert(apiError(e).message)) }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
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
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
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
                  <td>
                    <b style={{ color: 'var(--ink-900)' }}>{badge.name}</b>
                    <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem', wordBreak: 'break-word' }}>{badge.description}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="chip" style={{ 
                      background: badge.tier === 'gold' ? '#fef3c7' : badge.tier === 'silver' ? '#f1f5f9' : '#ffedd5',
                      color: badge.tier === 'gold' ? '#b45309' : badge.tier === 'silver' ? '#475569' : '#9a3412',
                      textTransform: 'capitalize', fontWeight: 700
                    }}>
                      {badge.tier}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{badge.award_type}</td>
                  <td className="muted font-mono text-3" style={{ whiteSpace: 'nowrap' }}>{badge.criteria ? `${badge.criteria.type} ≥ ${badge.criteria.count}` : 'Manual'}</td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatNumber(badge.awarded_count)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => awardBadge(badge)}>Award Manually…</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
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
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '500px' }}>
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
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--ink-900)' }}>{rule.label}</span>
                    <span className="chip chip--ghost" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>{rule.action}</span>
                  </td>
                  <td>
                    <input
                      className="input" style={{ width: '90px', padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--brand-blue-700)' }} type="number"
                      value={rule.points}
                      onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, points: e.target.value } : r)))}
                      aria-label="Points"
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <label className="row" style={{ gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', userSelect: 'none', flexWrap: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={rule.is_enabled}
                        onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, is_enabled: e.target.checked } : r)))}
                        style={{ accentColor: 'var(--brand-blue-600)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span className={rule.is_enabled ? 'text-primary' : 'muted'}>{rule.is_enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => saveRule(rule)}><Save size={14} /> Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  // Backend returns 'current' not 'period'
  const currentPeriod = leaderboard?.current

  return (
    <div className="admin-content" style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
      <AdminHeader 
        title="Settings & Config" 
        subtitle="Platform configuration and leaderboard management"
      />

      <div className="grid-3">
        <div style={{ width: '100%', minWidth: 0 }}>
          <section className="panel mb-3">
            <div className="panel__header">
              <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> Core Configuration
              </h2>
            </div>
            
            {/* Added padding and layout fixes inside panel__body to prevent overlap */}
            <div className="panel__body" style={{ width: '100%', boxSizing: 'border-box', padding: '1.5rem' }}>
              {saved && (
                <div className="banner banner--success mb-3" style={{ animation: 'modal-rise var(--dur) var(--ease)' }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span style={{ wordBreak: 'break-word' }}>Global configuration updated successfully.</span>
                </div>
              )}
              
              <div className="field" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cfg-site-name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Platform Name</label>
                <input 
                  id="cfg-site-name" 
                  className="input input--lg" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={settings.site_name ?? ''} 
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} 
                />
              </div>
              
              <div className="field" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cfg-site-desc" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Global SEO Description</label>
                <textarea 
                  id="cfg-site-desc" 
                  className="textarea" 
                  style={{ minHeight: '90px', width: '100%', boxSizing: 'border-box' }} 
                  value={settings.site_description ?? ''} 
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} 
                />
                <span className="hint muted" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem' }}>Used for metadata and default opengraph descriptions.</span>
              </div>
              
              <div className="field" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cfg-support" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Support URL</label>
                <input 
                  id="cfg-support" 
                  className="input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={settings.support_url ?? ''} 
                  onChange={(e) => setSettings({ ...settings, support_url: e.target.value })} 
                />
              </div>
              
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn--primary" onClick={save}>
                  <Check size={16} /> Save Configuration
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside style={{ width: '100%', minWidth: 0 }}>
          <section className="panel">
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
              
              {currentPeriod && (
                <div style={{ padding: '1.25rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', boxSizing: 'border-box' }}>
                  <div className="row row--between mb-1" style={{ fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <b>Active Cycle:</b>
                    <span className="chip" style={{ background: 'var(--brand-blue-50)', color: 'var(--brand-blue-700)' }}>Current Month</span>
                  </div>
                  <p className="muted text-3 mb-2">The current month's leaderboard is live and updates in real-time. Finalize to snapshot it.</p>
                  <button className="btn btn--danger btn--block mt-2" onClick={() => finalize(currentPeriod.period_key ?? new Date().toISOString().slice(0, 7))}>
                    <AlertTriangle size={16} /> Finalize Current Month
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