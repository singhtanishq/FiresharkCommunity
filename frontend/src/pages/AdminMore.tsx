import { useCallback, useEffect, useState } from 'react'
import { api, apiError } from '../api/client'
import { AdminHeader } from './Admin'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { Trophy } from 'lucide-react'

// ---------------------------------------------------- categories & tags

export function AdminTaxonomy() {
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [tagQ, setTagQ] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/categories'),
      api.get('/admin/tags', { params: { per_page: 40, q: tagQ || undefined } }),
    ])
      .then(([c, t]) => {
        setCategories(c.data.data)
        setTags(t.data.data)
      })
      .finally(() => setLoading(false))
  }, [tagQ])

  useEffect(load, [load])

  const createCategory = async () => {
    if (! newCategory.trim()) return
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

  const saveTag = async (tag: any) => {
    try {
      await api.put(`/admin/tags/${tag.id}`, { name: tag.name, description: tag.description })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  const mergeTag = async (tag: any) => {
    const targetId = window.prompt(`Merge "${tag.name}" into which tag id? (see ids in the table)`)
    if (! targetId) return
    try {
      await api.post(`/admin/tags/${tag.id}/merge`, { target_id: Number(targetId) })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading && categories.length === 0) return <Spinner />

  return (
    <div>
      <AdminHeader title="Categories & tags" />

      <section className="panel mb-2">
        <div className="panel__header"><h2>Categories</h2></div>
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Questions</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <input
                      className="input" style={{ width: 180, padding: '0.3rem 0.5rem' }}
                      value={category.name}
                      onChange={(e) => setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))}
                      aria-label="Category name"
                    />
                  </td>
                  <td className="muted">{category.slug}</td>
                  <td>{formatNumber(category.questions_count)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={category.is_active}
                      onChange={(e) => setCategories(categories.map((c) => (c.id === category.id ? { ...c, is_active: e.target.checked } : c)))}
                      aria-label="Active"
                    />
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => saveCategory(category)}>Save</button>
                      <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Delete this category?')) deleteCategory(category) }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ padding: '0.9rem 1.15rem' }}>
            <input className="input" style={{ maxWidth: 240 }} placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button className="btn btn--primary btn--sm" onClick={createCategory}>Add category</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Tags</h2>
          <input className="input" style={{ width: 200 }} placeholder="Search tags…" value={tagQ} onChange={(e) => setTagQ(e.target.value)} />
        </div>
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Questions</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="muted">{tag.id}</td>
                  <td>
                    <input
                      className="input" style={{ width: 180, padding: '0.3rem 0.5rem' }}
                      defaultValue={tag.name}
                      onBlur={(e) => {
                        if (e.target.value !== tag.name) saveTag({ ...tag, name: e.target.value })
                      }}
                      aria-label="Tag name"
                    />
                  </td>
                  <td>{formatNumber(tag.questions_count)}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => mergeTag(tag)}>Merge…</button>
                      <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Delete this tag?')) api.delete(`/admin/tags/${tag.id}`).then(load).catch((e) => alert(apiError(e).message)) }}>Delete</button>
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

// ------------------------------------------------- badges & reputation

export function AdminGamification() {
  const [badges, setBadges] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.get('/admin/badges'), api.get('/admin/reputation-rules')])
      .then(([b, r]) => {
        setBadges(b.data.data)
        setRules(r.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const awardBadge = async (badge: any) => {
    const username = window.prompt(`Award "${badge.name}" to username:`)
    if (! username) return
    try {
      await api.post(`/admin/badges/${badge.id}/award`, { username })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  const saveRule = async (rule: any) => {
    try {
      await api.put(`/admin/reputation-rules/${rule.id}`, { points: Number(rule.points), is_enabled: rule.is_enabled })
      load()
    } catch (e) { alert(apiError(e).message) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <AdminHeader title="Badges & reputation" />

      <section className="panel mb-2">
        <div className="panel__header"><h2>Badges</h2></div>
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Badge</th><th>Tier</th><th>Award</th><th>Criteria</th><th>Awarded</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id}>
                  <td><b>{badge.name}</b><div className="muted" style={{ fontSize: '0.8rem' }}>{badge.description}</div></td>
                  <td>{badge.tier}</td>
                  <td>{badge.award_type}</td>
                  <td className="muted">{badge.criteria ? `${badge.criteria.type} ≥ ${badge.criteria.count}` : '—'}</td>
                  <td>{formatNumber(badge.awarded_count)}</td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => awardBadge(badge)}>Award…</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header"><h2>Reputation rules</h2></div>
        <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Action</th><th>Points</th><th>Enabled</th><th></th></tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.label} <span className="muted">({rule.action})</span></td>
                  <td>
                    <input
                      className="input" style={{ width: 80, padding: '0.3rem 0.5rem' }} type="number"
                      value={rule.points}
                      onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, points: e.target.value } : r)))}
                      aria-label="Points"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.is_enabled}
                      onChange={(e) => setRules(rules.map((r) => (r.id === rule.id ? { ...r, is_enabled: e.target.checked } : r)))}
                      aria-label="Enabled"
                    />
                  </td>
                  <td><button className="btn btn--ghost btn--sm" onClick={() => saveRule(rule)}>Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// -------------------------------------------------- settings & leaderboard

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
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { alert(apiError(e).message) }
  }

  const finalize = async (periodKey: string) => {
    if (! window.confirm(`Finalize leaderboard for ${periodKey}? This snapshot closes the period.`)) return
    try {
      await api.post('/admin/leaderboard/finalize', { period_key: periodKey })
      const l = await api.get('/admin/leaderboard')
      setLeaderboard(l.data.data)
    } catch (e) { alert(apiError(e).message) }
  }

  return (
    <div>
      <AdminHeader title="Settings & leaderboard" />

      <section className="panel mb-2">
        <div className="panel__header"><h2>Site content</h2></div>
        <div className="panel__body">
          {saved && <div className="form-success">Settings saved.</div>}
          <div className="field">
            <label htmlFor="cfg-site-name">Site name</label>
            <input id="cfg-site-name" className="input" value={settings.site_name ?? ''} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="cfg-site-desc">Site description</label>
            <textarea id="cfg-site-desc" className="textarea" style={{ minHeight: 70 }} value={settings.site_description ?? ''} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="cfg-support">Support URL</label>
            <input id="cfg-support" className="input" value={settings.support_url ?? ''} onChange={(e) => setSettings({ ...settings, support_url: e.target.value })} />
          </div>
          <button className="btn btn--primary" onClick={save}>Save settings</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header"><h2>Leaderboard periods</h2></div>
        <div className="panel__body" style={{ padding: 0 }}>
          {! leaderboard
            ? <Spinner />
            : leaderboard.periods.length === 0
              ? <EmptyState icon={<Trophy size={32} strokeWidth={1.5} />} title="No finalized periods yet. Finalize the current month at month end." />
              : (
                <table className="data-table">
                  <thead><tr><th>Period</th><th>Status</th><th>Finalized</th></tr></thead>
                  <tbody>
                    {leaderboard.periods.map((p: any) => (
                      <tr key={p.period_key}>
                        <td><b>{p.period_key}</b></td>
                        <td>{p.status}</td>
                        <td className="muted">{p.finalized_at ? new Date(p.finalized_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          {leaderboard?.period && leaderboard.period.is_current && (
            <div style={{ padding: '0.9rem 1.15rem' }}>
              <button className="btn btn--danger btn--sm" onClick={() => finalize(leaderboard.period.period_key)}>
                Finalize {leaderboard.period.period_key} now
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}