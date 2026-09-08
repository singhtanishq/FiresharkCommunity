import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { questionsApi, categoriesApi, leaderboardApi } from '../api/endpoints'
import type { Category, LeaderboardPerson, Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber, timeAgo } from '../lib/format'

const CATEGORY_ICONS: Record<string, string> = {
  shield: '🛡️', terminal: '⌨️', crosshair: '🎯', bug: '🐞', network: '🌐',
  cloud: '☁️', radar: '📡', target: '🎯', globe: '🕸️', api: '🔌',
  search: '🔍', alert: '🚨', tool: '🛠️', certificate: '🎓', briefcase: '💼', flask: '🧪',
}

function CategoryIcon({ icon, size = '1.6rem' }: { icon: string | null; size?: string }) {
  return <span aria-hidden="true" style={{ fontSize: size }}>{CATEGORY_ICONS[icon ?? ''] ?? '📁'}</span>
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

export function Home() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [top, setTop] = useState<LeaderboardPerson[]>([])
  const [stats, setStats] = useState<{ total: number; totalAnswers: number; users: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      questionsApi.list({ per_page: 8, sort: 'activity' }),
      categoriesApi.list(),
      leaderboardApi.index(),
    ]).then(([q, c, lb]) => {
      setQuestions(q.data)
      setCategories(c)
      setTop((lb.contributors ?? []).slice(0, 5))
      setStats({
        total: q.meta.total,
        totalAnswers: q.data.reduce((acc, x) => acc + x.answers_count, 0),
        users: lb.all_time?.contributors.length ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const [heroQ, setHeroQ] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = heroQ.trim()
    if (t) window.location.assign(`/search?q=${encodeURIComponent(t)}`)
  }

  return (
    <div>
      <section className="hero">
        <div className="hero__eyebrow">
          <span>●</span> FireShark Community
        </div>
        <h1 className="hero__title">
          Ask questions. Share knowledge. <em>Build expertise.</em>
        </h1>
        <p className="hero__sub">
          A technical community for cybersecurity professionals, learners, ethical hackers and technology
          enthusiasts — peer-reviewed answers, an active monthly leaderboard, and a knowledge base that
          keeps growing.
        </p>
        <form className="hero__search" role="search" onSubmit={submit}>
          <span style={{ paddingLeft: '0.9rem', color: 'rgba(255,255,255,0.55)' }} aria-hidden="true">⌕</span>
          <input
            value={heroQ}
            onChange={(e) => setHeroQ(e.target.value)}
            placeholder="Search Nmap, Burp, AWS IAM, incident response…"
            aria-label="Search the community"
          />
          <button className="btn btn--primary btn--sm" type="submit">Search</button>
        </form>
        <div className="hero__actions">
          <Link to="/ask" className="btn btn--fire">Ask a Question</Link>
          <Link to="/questions" className="btn btn--ghost">Explore Questions</Link>
        </div>
      </section>

      {stats && (
        <section aria-label="Community at a glance" className="stat-grid mb-2">
          <Stat value={formatNumber(stats.total)} label="Questions" accent />
          <Stat value={formatNumber(stats.totalAnswers)} label="Answers" />
          <Stat value={formatNumber(stats.users)} label="Contributors" />
          <Stat value={formatNumber(top.length > 0 ? top[0].score ?? 0 : 0)} label="Top monthly score" />
        </section>
      )}

      <div className="grid-3">
        <section aria-labelledby="recent-activity">
          <div className="page-header">
            <div>
              <h1 id="recent-activity">Recent activity</h1>
              <p>Fresh questions and ongoing discussions.</p>
            </div>
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
            <div className="panel__header">
              <h2>Categories</h2>
              <Link to="/categories" className="muted" style={{ fontSize: '0.84rem' }}>All →</Link>
            </div>
            <div className="panel__body" style={{ paddingTop: '0.4rem' }}>
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="row row--between"
                  style={{ padding: '0.45rem 0.15rem', borderBottom: '1px dashed var(--border)', color: 'inherit' }}
                >
                  <span className="row" style={{ gap: '0.55rem' }}>
                    <CategoryIcon icon={category.icon} />
                    <span style={{ fontWeight: 500 }}>{category.name}</span>
                  </span>
                  <span className="muted">{formatNumber(category.questions_count)}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel mt-2">
            <div className="panel__header">
              <h2>Top contributors this month</h2>
              <Link to="/leaderboard" className="muted" style={{ fontSize: '0.84rem' }}>All →</Link>
            </div>
            <div className="panel__body" style={{ padding: 0 }}>
              {top.length === 0
                ? <div style={{ padding: '1rem 1.25rem' }} className="muted">No contributors yet — be the first to answer and earn reputation.</div>
                : top.map((person, i) => (
                  <div key={person.username} className="row row--between" style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="row" style={{ gap: '0.6rem' }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-blue-600)',
                        color: '#fff', fontSize: 12, display: 'inline-grid', placeItems: 'center', fontWeight: 700,
                      }}>#{i + 1}</span>
                      <div>
                        <Link to={`/users/${person.username}`} style={{ fontWeight: 600, color: 'inherit' }}>{person.name}</Link>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>{formatNumber(person.score ?? 0)} points</div>
                      </div>
                    </div>
                    <span className="muted">{timeAgo(new Date().toISOString())}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
