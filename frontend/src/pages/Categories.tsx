import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '../api/endpoints'
import type { Category } from '../types'
import { formatNumber } from '../lib/format'
import { Spinner, EmptyState } from '../components/ui/States'
import { FolderOpen, Shield, Terminal, Crosshair, Bug, Network, Cloud, Radar, Target, Globe, Cpu, Search, AlertTriangle, Wrench, Award, Briefcase, FlaskConical } from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  shield: Shield,
  terminal: Terminal,
  crosshair: Crosshair,
  bug: Bug,
  network: Network,
  cloud: Cloud,
  radar: Radar,
  target: Target,
  globe: Globe,
  api: Cpu,
  search: Search,
  alert: AlertTriangle,
  tool: Wrench,
  certificate: Award,
  briefcase: Briefcase,
  flask: FlaskConical,
}

export function CategoryIcon({ icon, size = '1.3rem' }: { icon: string | null; size?: string }) {
  const Icon = CATEGORY_ICONS[icon ?? '']
  if (!Icon) return <span aria-hidden="true" style={{ fontSize: size }}><FolderOpen size={16} strokeWidth={1.5} /></span>
  return <Icon size={parseInt(size) || 16} strokeWidth={2} />
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesApi.list().then(setCategories).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-toolbar">
        <h1>Categories</h1>
      </div>
      <p className="muted mb-2">Browse questions by topic.</p>

      {categories.length === 0
        ? <EmptyState icon={<FolderOpen size={32} strokeWidth={1.5} />} title="No categories yet." />
        : (
          <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {categories.map((category) => (
              <Link key={category.id} to={`/categories/${category.slug}`} className="panel" style={{ padding: '1.1rem 1.25rem', color: 'inherit' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="row"><CategoryIcon icon={category.icon} /> <b>{category.name}</b></span>
                  <span className="muted">{formatNumber(category.questions_count)} Q</span>
                </div>
                {category.description && <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{category.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
  )
}