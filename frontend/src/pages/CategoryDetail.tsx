import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { categoriesApi } from '../api/endpoints'
import type { Question, Tag as TagType } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'
import { CategoryIcon } from './Categories'
import { formatNumber } from '../lib/format'
import { 
  MessageSquare, FolderOpen, ChevronRight, Plus, 
  FileText, CheckCircle2, HelpCircle, Tag 
} from 'lucide-react'

const SORTS = [
  ['latest', 'Latest'],
  ['popular', 'Popular'],
  ['most_voted', 'Most voted'],
  ['unanswered', 'Unanswered'],
] as const

export function CategoryDetail() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<{
    category: { id: number; name: string; slug: string; description: string | null; icon: string | null }
    stats: { total: number; unanswered: number; solved: number }
    related_tags: TagType[]
    questions: { data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const sort = searchParams.get('sort') ?? 'latest'
  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    setLoading(true)
    categoriesApi.show(slug, { page, sort })
      .then(setData)
      .finally(() => setLoading(false))
  }, [slug, sort, page])

  if (loading && !data) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>
  if (!data) {
    return (
      <div className="panel" style={{ padding: '4rem 2rem', marginTop: '2rem' }}>
        <EmptyState 
          icon={<FolderOpen size={48} color="var(--brand-blue-400)" strokeWidth={1.5} />} 
          title="Ecosystem not found." 
          action={<Link to="/categories" className="btn btn--primary">View all ecosystems</Link>} 
        />
      </div>
    )
  }

  const { category, stats, related_tags, questions } = data

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Breadcrumbs */}
      <nav className="breadcrumb row" style={{ gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.88rem' }} aria-label="Breadcrumb">
        <Link to="/categories" style={{ color: 'var(--text-3)', fontWeight: 500 }}>Ecosystems</Link>
        <ChevronRight size={14} color="var(--border-strong)" />
        <span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{category.name}</span>
      </nav>

      {/* Premium Header */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div className="row" style={{ gap: '1.25rem', flex: 1, minWidth: '300px' }}>
          <div 
            style={{ 
              width: '64px', height: '64px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--brand-blue-50)', 
              color: 'var(--brand-blue-600)', 
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 12px rgba(22, 122, 201, 0.1)'
            }}
          >
            <CategoryIcon icon={category.icon} size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>
              {category.name}
            </h1>
            {category.description && (
              <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5, maxWidth: '640px' }}>
                {category.description}
              </p>
            )}
          </div>
        </div>
        <Link 
          to="/ask" 
          className="btn btn--fire btn--lg" 
          style={{ boxShadow: '0 8px 16px -4px rgba(242, 96, 12, 0.3)', borderRadius: '99px', padding: '0.8rem 1.6rem' }}
        >
          <Plus size={18} strokeWidth={2.5} /> Ignite Discussion
        </Link>
      </div>

      {/* Integrated Stats & Tags Control Bar */}
      <div className="panel row row--between" style={{ padding: '1.1rem 1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
        
        <div className="row" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <FileText size={18} color="var(--brand-blue-500)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
              <b style={{ color: 'var(--ink-900)', fontSize: '1.15rem', marginRight: '0.2rem' }}>{formatNumber(stats.total)}</b> 
              threads
            </span>
          </div>
          <div className="row" style={{ gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
              <b style={{ color: 'var(--success)', fontSize: '1.15rem', marginRight: '0.2rem' }}>{formatNumber(stats.solved)}</b> 
              solved
            </span>
          </div>
          <div className="row" style={{ gap: '0.5rem' }}>
            <HelpCircle size={18} color="#d97706" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
              <b style={{ color: '#d97706', fontSize: '1.15rem', marginRight: '0.2rem' }}>{formatNumber(stats.unanswered)}</b> 
              unanswered
            </span>
          </div>
        </div>

        {related_tags.length > 0 && (
          <div className="row" style={{ gap: '0.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
            <Tag size={16} color="var(--text-3)" />
            <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
              {related_tags.map((tag) => (
                <Link key={tag.id} className="chip chip--ghost" style={{ fontSize: '0.78rem', padding: '0.15rem 0.6rem' }} to={`/tags/${tag.slug}`}>
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Segmented Control Sorting */}
      <div className="row" style={{ marginBottom: '1.5rem', animation: 'fade-in var(--dur-slow) var(--ease) 0.15s both' }}>
        <div 
          style={{ 
            background: 'var(--surface-2)', 
            padding: '0.3rem', 
            borderRadius: 'var(--radius)', 
            display: 'inline-flex', 
            gap: '0.2rem',
            border: '1px solid var(--border)' 
          }}
        >
          {SORTS.map(([value, label]) => {
            const isActive = sort === value
            return (
              <Link
                key={value}
                to={value === 'latest' ? `/categories/${slug}` : `/categories/${slug}?sort=${value}`}
                style={{
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: 'calc(var(--radius) - 2px)',
                  color: isActive ? 'var(--brand-blue-700)' : 'var(--text-2)',
                  background: isActive ? '#fff' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  textDecoration: 'none',
                  transition: 'all var(--dur-fast) var(--ease)'
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Question Feed */}
      <div className="question-list" style={{ gap: '1rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.2s both' }}>
        {questions.data.length === 0 ? (
          <div className="panel" style={{ padding: '3rem 2rem' }}>
            <EmptyState
              icon={<MessageSquare size={40} color="var(--brand-blue-300)" strokeWidth={1.5} />}
              title="No discussions here yet."
              action={<Link to="/ask" className="btn btn--fire"><Plus size={16} /> Ignite the first discussion</Link>}
            />
          </div>
        ) : (
          questions.data.map((question) => (
            <div key={question.id} style={{ transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <QuestionCard question={question} />
            </div>
          ))
        )}
      </div>

      {questions.meta.last_page > 1 && (
        <div className="mt-4 row row--between" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.3s both' }}>
          <Pagination meta={questions.meta} baseUrl={`/categories/${slug}?sort=${sort}`} />
        </div>
      )}
    </div>
  )
}