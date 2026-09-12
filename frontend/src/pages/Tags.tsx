import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { tagsApi } from '../api/endpoints'
import type { Question, Tag as TagType } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { 
  Tag, MessageSquare, Hash, Search, 
  ChevronRight, Plus, Activity, BookOpen
} from 'lucide-react'

export function Tags() {
  const [data, setData] = useState<{ data: TagType[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    tagsApi.list({ page, q: q || undefined, per_page: 30 }).then(setData)
  }, [page, q])

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Premium Header with proper spacing */}
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
            <Hash size={32} strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1.1 }}>
              System Tags
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              Filter and explore intelligence by specific technological signatures.
            </p>
          </div>
        </div>
        
        {/* Search / Filter Input */}
        <div className="input-affix" style={{ width: '100%', maxWidth: '320px' }}>
          <Search className="input-affix__icon" size={18} />
          <input
            className="input input--with-affix input--lg"
            placeholder="Search tags..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              const params = new URLSearchParams(searchParams)
              if (e.target.value) params.set('q', e.target.value)
              else params.delete('q')
              params.delete('page') // Reset page on search
              setSearchParams(params)
            }}
            aria-label="Filter tags"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          />
        </div>
      </div>

      {!data ? (
        <div style={{ padding: '4rem 0' }}><Spinner /></div>
      ) : data.data.length === 0 ? (
        <div className="panel" style={{ padding: '4rem 2rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
          <EmptyState 
            icon={<Tag size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} 
            title={q ? `No tags found matching "${q}".` : "No tags exist in the system yet."} 
          />
        </div>
      ) : (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '1.25rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' 
        }}>
          {data.data.map((tag) => (
            <Link 
              key={tag.id} 
              to={`/tags/${tag.slug}`} 
              className="panel" 
              style={{ 
                padding: '1.25rem', 
                color: 'inherit', 
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                e.currentTarget.style.borderColor = 'var(--brand-blue-400)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div className="row row--between mb-1" style={{ alignItems: 'flex-start' }}>
                <span className="chip" style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--brand-blue-50)', color: 'var(--brand-blue-700)', border: 'none' }}>
                  <Hash size={14} strokeWidth={2.5} /> {tag.name}
                </span>
              </div>
              <div className="muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {formatNumber(tag.questions_count)} {tag.questions_count === 1 ? 'discussion' : 'discussions'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="mt-4 row row--between" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.2s both' }}>
          <Pagination meta={data.meta} baseUrl={q ? `/tags?q=${encodeURIComponent(q)}` : '/tags'} />
        </div>
      )}
    </div>
  )
}

export function TagDetail() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<{ tag: TagType; questions: { data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } } | null>(null)
  const [notFound, setNotFound] = useState(false)

  const page = Number(searchParams.get('page') ?? 1)
  const sort = searchParams.get('sort') ?? 'latest'

  useEffect(() => {
    tagsApi.show(slug, { page, sort })
      .then(setData)
      .catch(() => setNotFound(true))
  }, [slug, page, sort])

  if (notFound) {
    return (
      <div className="panel" style={{ padding: '4rem 2rem', marginTop: '2rem' }}>
        <EmptyState 
          icon={<Tag size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} 
          title="Tag signature not found." 
          action={<Link to="/tags" className="btn btn--primary">View all tags</Link>} 
        />
      </div>
    )
  }

  if (!data) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>

  const baseUrl = `/tags/${slug}${sort !== 'latest' ? `?sort=${sort}` : ''}`

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Breadcrumbs */}
      <nav className="breadcrumb row" style={{ gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.88rem' }} aria-label="Breadcrumb">
        <Link to="/tags" style={{ color: 'var(--text-3)', fontWeight: 500 }}>System Tags</Link>
        <ChevronRight size={14} color="var(--border-strong)" />
        <span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{data.tag.name}</span>
      </nav>

      {/* Premium Header with proper spacing */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div className="row" style={{ gap: '1.25rem', flex: 1, minWidth: '300px' }}>
          <div 
            style={{ 
              width: '64px', height: '64px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--surface)', 
              color: 'var(--brand-blue-600)', 
              border: '2px solid var(--brand-blue-100)',
              display: 'grid', placeItems: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Hash size={32} strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.1 }}>
              {data.tag.name}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> 
              {formatNumber(data.questions.meta.total)} {data.questions.meta.total === 1 ? 'discussion' : 'discussions'} tagged
            </p>
          </div>
        </div>
        <Link 
          to={`/ask?tags=${data.tag.slug}`} 
          className="btn btn--fire btn--lg" 
          style={{ boxShadow: '0 8px 16px -4px rgba(242, 96, 12, 0.3)', borderRadius: '99px', padding: '0.8rem 1.6rem' }}
        >
          <Plus size={18} strokeWidth={2.5} /> Ask Question
        </Link>
      </div>

      {/* Description Panel */}
      {data.tag.description && (
        <div className="panel mb-4" style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-blue-50)', borderColor: 'var(--brand-blue-100)', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
          <div className="row" style={{ gap: '0.75rem', alignItems: 'flex-start' }}>
            <BookOpen size={20} color="var(--brand-blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: 'var(--brand-blue-700)', fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 500 }}>
              {data.tag.description}
            </p>
          </div>
        </div>
      )}

      {/* Feed */}
      <div style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
        {data.questions.data.length === 0 ? (
          <div className="panel" style={{ padding: '4rem 2rem' }}>
            <EmptyState 
              icon={<MessageSquare size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} 
              title={`No intelligence found for the signature "${data.tag.name}".`} 
              action={<Link to={`/ask?tags=${data.tag.slug}`} className="btn btn--primary"><Plus size={16} /> Be the first to ask</Link>}
            />
          </div>
        ) : (
          <div className="question-list" style={{ gap: '1rem' }}>
            {data.questions.data.map((question) => (
              <div 
                key={question.id} 
                style={{ transition: 'transform 0.3s ease' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} 
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <QuestionCard question={question} />
              </div>
            ))}
          </div>
        )}
      </div>

      {data.questions.meta.last_page > 1 && (
        <div className="mt-4 row row--between" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.2s both' }}>
          <Pagination meta={data.questions.meta} baseUrl={baseUrl} />
        </div>
      )}
    </div>
  )
}