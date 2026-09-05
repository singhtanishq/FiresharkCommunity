import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { tagsApi } from '../api/endpoints'
import type { Question, Tag } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'

export function Tags() {
  const [data, setData] = useState<{ data: Tag[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    tagsApi.list({ page, q: q || undefined, per_page: 30 }).then(setData)
  }, [page, q])

  return (
    <div>
      <div className="page-toolbar">
        <h1>Tags</h1>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Filter tags…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            const params = new URLSearchParams(searchParams)
            if (e.target.value) params.set('q', e.target.value)
            else params.delete('q')
            setSearchParams(params)
          }}
          aria-label="Filter tags"
        />
      </div>

      {! data
        ? <Spinner />
        : data.data.length === 0
          ? <EmptyState icon="🏷️" title="No tags found." />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
              {data.data.map((tag) => (
                <Link key={tag.id} to={`/tags/${tag.slug}`} className="panel" style={{ padding: '0.9rem 1rem', color: 'inherit' }}>
                  <b style={{ color: 'var(--blue-700)' }}>{tag.name}</b>
                  <div className="muted">{tag.questions_count} {tag.questions_count === 1 ? 'question' : 'questions'}</div>
                </Link>
              ))}
            </div>
          )}

      {data && <Pagination meta={data.meta} baseUrl={q ? `/tags?q=${encodeURIComponent(q)}` : '/tags'} />}
    </div>
  )
}

export function TagDetail() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<{ tag: Tag; questions: { data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } } | null>(null)
  const [notFound, setNotFound] = useState(false)

  const page = Number(searchParams.get('page') ?? 1)
  const sort = searchParams.get('sort') ?? 'latest'

  useEffect(() => {
    tagsApi.show(slug, { page, sort })
      .then(setData)
      .catch(() => setNotFound(true))
  }, [slug, page, sort])

  if (notFound) return <EmptyState icon="🏷️" title="Tag not found." />
  if (! data) return <Spinner />

  return (
    <div>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/tags">Tags</Link> › {data.tag.name}
      </nav>

      <div className="page-toolbar">
        <div>
          <h1>Questions tagged <span className="tag-chip" style={{ fontSize: '1rem' }}>{data.tag.name}</span></h1>
          <span className="muted">{data.questions.meta.total} {data.questions.meta.total === 1 ? 'question' : 'questions'}</span>
        </div>
        <Link to="/ask" className="btn btn--fire">Ask Question</Link>
      </div>

      {data.tag.description && <p className="muted mb-2">{data.tag.description}</p>}

      <div className="question-list">
        {data.questions.data.length === 0
          ? <div className="panel"><EmptyState icon="💬" title="No questions with this tag yet." /></div>
          : data.questions.data.map((question) => <QuestionCard key={question.id} question={question} />)}
      </div>

      <Pagination meta={data.questions.meta} baseUrl={`/tags/${slug}`} />
    </div>
  )
}
