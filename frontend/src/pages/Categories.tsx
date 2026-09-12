import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '../api/endpoints'
import type { Category } from '../types'
import { formatNumber } from '../lib/format'
import { Spinner, EmptyState } from '../components/ui/States'
import { 
  FolderOpen, Shield, Terminal, Crosshair, Bug, Network, Cloud, 
  Radar, Target, Globe, Cpu, Search, AlertTriangle, Wrench, Award, 
  Briefcase, FlaskConical, Layers, ChevronRight 
} from 'lucide-react'

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

export function CategoryIcon({ icon, size = 20 }: { icon: string | null; size?: number }) {
  const Icon = CATEGORY_ICONS[icon ?? ''] || FolderOpen
  return <Icon size={size} strokeWidth={2} />
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesApi.list().then(setCategories).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Premium Page Header */}
      <div style={{ marginBottom: '2.5rem', maxWidth: '800px', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 0.75rem', flexWrap: 'wrap', wordBreak: 'break-word' }}>
          <div style={{ 
            display: 'grid', placeItems: 'center', 
            width: '48px', height: '48px', 
            background: 'var(--brand-blue-50)', color: 'var(--brand-blue-600)', 
            borderRadius: 'var(--radius-lg)',
            flexShrink: 0
          }}>
            <Layers size={28} strokeWidth={2.5} />
          </div>
          <span>Categories</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
          Browse specialized technical topics, discover deep-dives, and find the exact security expertise you need across our organized domains.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="panel" style={{ padding: '4rem 2rem' }}>
          <EmptyState icon={<FolderOpen size={48} color="var(--brand-blue-400)" strokeWidth={1.5} />} title="No categories defined yet." />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {categories.map((category, i) => (
            <Link 
              key={category.id} 
              to={`/categories/${category.slug}`} 
              className="panel"
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '1.6rem',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: `modal-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both`,
                boxSizing: 'border-box',
                overflowX: 'hidden',
                minWidth: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                e.currentTarget.style.borderColor = 'var(--brand-blue-400)'
                const iconWrap = e.currentTarget.querySelector('.icon-wrapper') as HTMLElement
                if (iconWrap) iconWrap.style.background = 'var(--brand-blue-600)';
                if (iconWrap) iconWrap.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
                e.currentTarget.style.borderColor = 'var(--border)'
                const iconWrap = e.currentTarget.querySelector('.icon-wrapper') as HTMLElement
                if (iconWrap) iconWrap.style.background = 'var(--brand-blue-50)';
                if (iconWrap) iconWrap.style.color = 'var(--brand-blue-600)';
              }}
            >
              <div className="row row--between" style={{ alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div 
                  className="icon-wrapper"
                  style={{
                    width: '46px', height: '46px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--brand-blue-50)', 
                    color: 'var(--brand-blue-600)',
                    display: 'grid', placeItems: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                >
                  <CategoryIcon icon={category.icon} size={24} />
                </div>
                <span className="chip chip--ghost" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', flexShrink: 0 }}>
                  {formatNumber(category.questions_count)} Threads
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 0.5rem', wordBreak: 'break-word' }}>
                {category.name}
              </h3>
              
              <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.55, margin: '0 0 1.5rem', flex: 1, wordBreak: 'break-word' }}>
                {category.description || 'Explore active questions, peer-reviewed discussions, and expert insights within this domain.'}
              </p>
              
              <div 
                className="row" 
                style={{ 
                  color: 'var(--brand-blue-600)', 
                  fontSize: '0.88rem', 
                  fontWeight: 700, 
                  gap: '0.25rem',
                  marginTop: 'auto',
                  flexWrap: 'nowrap'
                }}
              >
                <span>Explore category</span> <ChevronRight size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}