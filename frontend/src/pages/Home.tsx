import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { questionsApi, categoriesApi } from '../api/endpoints'
import type { Category, Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'

export function Home() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      questionsApi.list({ per_page: 8, sort: 'activity' }),
      categoriesApi.list(),
    ])
      .then(([q, c]) => {
        setQuestions(q.data)
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="hero">
        <h1>Ask questions. Share knowledge. Build expertise.</h1>
        <p>
          A technical community for cybersecurity professionals, learners, ethical hackers and technology
          enthusiasts. Ask, answer, and grow with FireShark.
        </p>
        <div className="hero__actions">
          <Link to="/ask" className="btn btn--fire btn--lg">Ask a Question</Link>
          <Link to="/questions" className="btn btn--ghost btn--lg" style={{ color: '#dce6f5' }}>Explore Questions</Link>
        </div>
      </section>

      <div className="grid-2" style={{ gridTemplateColumns: '1.7fr 1fr', alignItems: 'start' }}>
        <section aria-labelledby="recent-questions">
          <div className="page-toolbar">
            <h2 id="recent-questions" style={{ margin: 0 }}>Recent activity</h2>
            <Link to="/questions" className="btn btn--ghost btn--sm">View all</Link>
          </div>

          {loading
            ? <Spinner />
            : questions.length === 0
              ? (
                <div className="panel">
                  <EmptyState
                    icon="💬"
                    title="No questions here yet. Be the first to ask."
                    action={<Link to="/ask" className="btn btn--fire">Ask the first question</Link>}
                  />
                </div>
              )
              : (
                <div className="question-list">
                  {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
                </div>
              )}
        </section>

        <aside>
          <div className="panel">
            <div className="panel__header"><h2>Categories</h2></div>
            <div className="panel__body" style={{ paddingTop: '0.4rem' }}>
              {categories.slice(0, 10).map((category) => (
                <div key={category.id} className="row--between row" style={{ padding: '0.4rem 0' }}>
                  <Link to={`/categories/${category.slug}`}>{category.name}</Link>
                  <span className="muted">{formatNumber(category.questions_count)}</span>
                </div>
              ))}
              {categories.length === 0 && <p className="muted">No categories yet.</p>}
              {categories.length > 10 && (
                <div className="mt-1"><Link to="/categories" className="muted">All categories →</Link></div>
              )}
            </div>
          </div>

          <div className="panel mt-2">
            <div className="panel__header"><h2>Help grow the community</h2></div>
            <div className="panel__body">
              <p className="muted" style={{ marginTop: 0 }}>
                Answer open questions to earn reputation and badges.
              </p>
              <Link to="/questions/unanswered" className="btn btn--primary btn--sm">
                Find unanswered questions
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
