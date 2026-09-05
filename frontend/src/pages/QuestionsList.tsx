import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { questionsApi } from '../api/endpoints'
import type { Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'

const SORTS = [
  ['latest', 'Latest'],
  ['most_answered', 'Most answered'],
  ['most_viewed', 'Most viewed'],
  ['most_voted', 'Most voted'],
  ['unanswered', 'Unanswered'],
] as const

export function QuestionsList({ unansweredOnly = false }: { unansweredOnly?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  const sort = searchParams.get('sort') ?? (unansweredOnly ? 'unanswered' : 'latest')
  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    setLoading(true)
    questionsApi.list({
      page,
      sort,
      unanswered: unansweredOnly || undefined,
      per_page: 15,
    })
      .then((res) => {
        setQuestions(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }, [sort, page, unansweredOnly, location.pathname])

  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    params.delete('page')
    setSearchParams(params)
  }

  const baseUrl = location.pathname + (searchParams.has('sort') ? `?sort=${sort}` : '')

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1 style={{ marginBottom: 2 }}>{unansweredOnly ? 'Unanswered questions' : 'All questions'}</h1>
          <span className="muted">
            {loading ? 'Loading…' : `${meta.total} ${meta.total === 1 ? 'question' : 'questions'}`}
          </span>
        </div>
        <Link to="/ask" className="btn btn--fire">Ask Question</Link>
      </div>

      {! unansweredOnly && (
        <div className="sort-tabs" role="navigation" aria-label="Sort questions">
          {SORTS.map(([value, label]) => (
            <button
              key={value}
              className={sort === value ? 'is-active' : ''}
              style={{ all: 'unset', cursor: 'pointer' }}
              onClick={() => setSort(value)}
            >
              <span className={sort === value ? 'is-active' : ''} style={{ padding: '0.32rem 0.7rem', borderRadius: 999, display: 'inline-block' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {loading
          ? <Spinner />
          : questions.length === 0
            ? (
              <div className="panel">
                <EmptyState
                  icon={unansweredOnly ? '🎉' : '💬'}
                  title={unansweredOnly ? 'No unanswered questions right now.' : 'No questions here yet. Be the first to ask.'}
                  action={<Link to="/ask" className="btn btn--fire">Ask a question</Link>}
                />
              </div>
            )
            : (
              <div className="question-list">
                {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
              </div>
            )}
      </div>

      {! loading && <Pagination meta={meta} baseUrl={baseUrl} />}
    </div>
  )
}
