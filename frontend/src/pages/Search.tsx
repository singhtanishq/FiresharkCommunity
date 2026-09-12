import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/endpoints'
import type { Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { Search as SearchIcon, FileQuestion, Plus, Filter, SearchX } from 'lucide-react'

const SORTS = [
  ['relevance', 'Relevance'],
  ['latest', 'Latest'],
  ['votes', 'Highest Voted']
] as const

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const sort = searchParams.get('sort') ?? 'relevance'

  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!q.trim()) {
      setLoading(false)
      setQuestions([])
      setMeta({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
      return
    }
    setLoading(true)
    searchApi.query({ q, page, sort })
      .then((res) => {
        setQuestions(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }, [q, page, sort])

  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    params.delete('page')
    setSearchParams(params)
  }

  const baseUrl = `/search?q=${encodeURIComponent(q)}${sort !== 'relevance' ? `&sort=${sort}` : ''}`

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Premium Header */}
      <div className="row row--between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
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
            <SearchIcon size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>
              Global Search
            </h1>
            <div style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {q ? (
                <>
                  Scanning intelligence for <span className="chip" style={{ background: 'var(--ink-100)', color: 'var(--ink-900)', fontWeight: 700, fontSize: '0.9rem' }}>"{q}"</span>
                  {!loading && (
                    <span className="muted" style={{ marginLeft: '0.2rem' }}>
                      — {formatNumber(meta.total)} {meta.total === 1 ? 'match' : 'matches'} found
                    </span>
                  )}
                </>
              ) : (
                'Enter a query in the top navigation to search the knowledge base.'
              )}
            </div>
          </div>
        </div>
        <Link 
          to="/ask" 
          className="btn btn--fire btn--lg" 
          style={{ boxShadow: '0 8px 16px -4px rgba(242, 96, 12, 0.3)', borderRadius: '99px', padding: '0.8rem 1.6rem' }}
        >
          <Plus size={18} strokeWidth={2.5} /> Ask a Question
        </Link>
      </div>

      {/* Segmented Control Sorting */}
      {q && questions.length > 0 && !loading && (
        <div className="row" style={{ marginBottom: '2rem', animation: 'fade-in var(--dur-slow) var(--ease) 0.15s both', flexWrap: 'wrap' }}>
          <div 
            style={{ 
              background: 'var(--surface-2)', 
              padding: '0.3rem', 
              borderRadius: 'var(--radius)', 
              display: 'inline-flex', 
              gap: '0.2rem',
              border: '1px solid var(--border)',
              alignItems: 'center'
            }}
          >
            <div style={{ padding: '0 0.5rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
              <Filter size={16} />
            </div>
            {SORTS.map(([value, label]) => {
              const isActive = sort === value
              return (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  style={{
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderRadius: 'calc(var(--radius) - 2px)',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive ? 'var(--brand-blue-700)' : 'var(--text-2)',
                    background: isActive ? '#fff' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--dur-fast) var(--ease)'
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Results Feed */}
      <div style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.2s both' }}>
        {!q ? (
          <div className="panel" style={{ padding: '5rem 2rem', background: 'var(--surface-2)', borderStyle: 'dashed' }}>
            <EmptyState
              icon={<SearchIcon size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />}
              title="Awaiting search parameters."
              action={<Link to="/questions" className="btn btn--primary"><FileQuestion size={16} /> Browse all questions instead</Link>}
            />
          </div>
        ) : loading ? (
          <div style={{ padding: '4rem 0' }}>
            <Spinner />
          </div>
        ) : questions.length === 0 ? (
          <div className="panel" style={{ padding: '4rem 2rem' }}>
            <EmptyState
              icon={<SearchX size={48} color="var(--text-3)" strokeWidth={1.5} />}
              title="No intelligence found for that query."
              action={
                <Link to={`/ask?title=${encodeURIComponent(q)}`} className="btn btn--fire">
                  <Plus size={16} /> Ask the community about "{q}"
                </Link>
              }
            />
          </div>
        ) : (
          <div className="question-list" style={{ gap: '1rem' }}>
            {questions.map((question) => (
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

      {/* Pagination */}
      {!loading && meta.last_page > 1 && (
        <div className="mt-4 row row--between" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.3s both' }}>
          <Pagination meta={meta} baseUrl={baseUrl} />
        </div>
      )}
    </div>
  )
}