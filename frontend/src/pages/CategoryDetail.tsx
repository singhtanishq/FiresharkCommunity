import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { categoriesApi } from '../api/endpoints'
import type { Question, Tag } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'
import { CategoryIcon } from './Categories'

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
    related_tags: Tag[]
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

  if (loading && ! data) return <Spinner />
  if (! data) {
    return <EmptyState icon="📁" title="Category not found." action={<Link to="/categories" className="btn btn--primary">All categories</Link>} />
  }

  const { category, stats, related_tags, questions } = data

  return (
    <div>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/categories">Categories</Link> › {category.name}
      </nav>

      <div className="page-toolbar">
        <div>
          <h1 className="row"><CategoryIcon icon={category.icon} size="1.6rem" /> {category.name}</h1>
          {category.description && <p className="muted" style={{ margin: '0.3rem 0 0' }}>{category.description}</p>}
        </div>
        <Link to="/ask" className="btn btn--fire">Ask Question</Link>
      </div>

      <div className="row mb-2" style={{ gap: '1.4rem' }}>
        <span className="muted"><b style={{ color: 'var(--ink-2)' }}>{stats.total}</b> questions</span>
        <span className="muted"><b style={{ color: 'var(--green-600)' }}>{stats.solved}</b> solved</span>
        <span className="muted"><b style={{ color: 'var(--fire-500)' }}>{stats.unanswered}</b> unanswered</span>
      </div>

      {related_tags.length > 0 && (
        <div className="row mb-2">
          {related_tags.map((tag) => (
            <Link key={tag.id} className="tag-chip" to={`/tags/${tag.slug}`}>{tag.name}</Link>
          ))}
        </div>
      )}

      <div className="sort-tabs">
        {SORTS.map(([value, label]) => (
          <Link
            key={value}
            to={value === 'latest' ? `/categories/${slug}` : `/categories/${slug}?sort=${value}`}
            className={sort === value ? 'is-active' : ''}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="question-list mt-2">
        {questions.data.length === 0
          ? (
            <div className="panel">
              <EmptyState
                icon="💬"
                title="No questions in this category yet. Be the first to ask."
                action={<Link to="/ask" className="btn btn--fire">Ask a question</Link>}
              />
            </div>
          )
          : questions.data.map((question) => <QuestionCard key={question.id} question={question} />)}
      </div>

      <Pagination meta={questions.meta} baseUrl={`/categories/${slug}?sort=${sort}`} />
    </div>
  )
}
