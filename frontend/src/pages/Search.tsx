import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/endpoints'
import type { Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, Spinner } from '../components/ui/States'

export function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const sort = searchParams.get('sort') ?? 'relevance'

  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (! q) {
      setLoading(false)
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

  return (
    <div>
      <h1>Search results</h1>
      <p className="muted mb-2">
        {q ? <>Results for “<b>{q}</b>”{meta.total > 0 && ` — ${meta.total} found`}</> : 'Type a search term above.'}
      </p>

      {loading
        ? <Spinner />
        : questions.length === 0
          ? (
            <div className="panel">
              <EmptyState
                icon="🔎"
                title="No questions matched your search."
                action={<Link to="/ask" className="btn btn--primary">Ask your own question</Link>}
              />
            </div>
          )
          : (
            <div className="question-list">
              {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
            </div>
          )}

      <Pagination meta={meta} baseUrl={`/search?q=${encodeURIComponent(q)}`} />
    </div>
  )
}
