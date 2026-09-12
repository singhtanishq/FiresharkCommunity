import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { questionsApi, categoriesApi, leaderboardApi } from '../api/endpoints'
import type { Category, LeaderboardPerson, Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { 
  Shield, Terminal, Crosshair, Bug, Network, Cloud, 
  Radar, Target, Globe, Cpu, Search, AlertTriangle, 
  Wrench, Award, Briefcase, FlaskConical, MessageSquare,
  FolderOpen, ChevronRight, Activity
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  shield: Shield, terminal: Terminal, crosshair: Crosshair, bug: Bug,
  network: Network, cloud: Cloud, radar: Radar, target: Target, globe: Globe,
  api: Cpu, search: Search, alert: AlertTriangle, tool: Wrench, certificate: Award,
  briefcase: Briefcase, flask: FlaskConical,
}

function CategoryIcon({ icon, size = 18 }: { icon: string | null; size?: number }) {
  const Icon = CATEGORY_ICONS[icon ?? ''] || FolderOpen
  return <Icon size={size} strokeWidth={2} />
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className={`panel stat-card ${accent ? 'stat-card--accent' : ''}`} style={{ transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}>
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
  
  const navigate = useNavigate()
  const [heroQ, setHeroQ] = useState('')

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = heroQ.trim()
    if (t) navigate(`/search?q=${encodeURIComponent(t)}`)
  }

  return (
    <div className="app-main">
      <section className="hero">
        <div className="hero__eyebrow">
          <Award size={14} strokeWidth={2.5} /> FireShark Community
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
          <Search style={{ color: 'rgba(255, 255, 255, 0.55)', marginLeft: '0.8rem' }} aria-hidden="true" size={20} strokeWidth={2} />
          <input
            value={heroQ}
            onChange={(e) => setHeroQ(e.target.value)}
            placeholder="Search Nmap, Burp, AWS IAM, incident response…"
            aria-label="Search the community"
          />
          <button className="btn btn--primary btn--sm" type="submit" disabled={!heroQ.trim()}>
            Search
          </button>
        </form>
        <div className="hero__actions">
          <Link to="/ask" className="btn btn--fire">Ask a Question</Link>
          <Link to="/questions" className="btn btn--ghost">Explore Questions</Link>
        </div>
      </section>

      {stats && (
        <section aria-label="Community at a glance" className="stat-grid mb-3">
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
              <h1 id="recent-activity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={24} color="var(--brand-blue-600)" />
                Recent activity
              </h1>
              <p>Fresh questions and ongoing discussions.</p>
            </div>
            <Link to="/questions" className="btn btn--ghost btn--sm">View all</Link>
          </div>

          {loading ? (
            <Spinner />
          ) : questions.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<MessageSquare size={32} strokeWidth={1.5} />}
                title="No questions here yet. Be the first to ask."
                action={<Link to="/ask" className="btn btn--fire">Ask the first question</Link>}
              />
            </div>
          ) : (
            <div className="question-list">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="panel mb-3">
            <div className="panel__header">
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Categories</h2>
              <Link to="/categories" className="muted" style={{ fontSize: '0.84rem', fontWeight: 500 }}>All →</Link>
            </div>
            <div className="panel__body" style={{ padding: '0.5rem' }}>
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="row row--between"
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    color: 'inherit',
                    textDecoration: 'none',
                    transition: 'background var(--dur) var(--ease)'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="row" style={{ gap: '0.75rem' }}>
                    <span 
                      style={{ 
                        display: 'grid', placeItems: 'center', 
                        width: '32px', height: '32px', 
                        background: 'var(--brand-blue-50)', color: 'var(--brand-blue-600)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <CategoryIcon icon={category.icon} />
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--ink-800)', fontSize: '0.92rem' }}>{category.name}</span>
                  </span>
                  <div className="row" style={{ gap: '0.25rem' }}>
                    <span className="text-3 muted font-mono">{formatNumber(category.questions_count)}</span>
                    <ChevronRight size={14} color="var(--ink-300)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {!loading && top.length > 0 && (
            <div className="panel">
              <div className="panel__header">
                <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Top Contributors</h2>
                <Link to="/leaderboard" className="muted" style={{ fontSize: '0.84rem', fontWeight: 500 }}>Rankings →</Link>
              </div>
              <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.75rem' }}>
                {top.map((person, index) => (
                  <Link 
                    key={person.id} 
                    to={`/profile/${person.username}`}
                    className="row row--between" 
                    style={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      transition: 'background var(--dur) var(--ease)'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="avatar-row">
                      <span style={{ 
                        width: '20px', fontWeight: 700, fontSize: '0.85rem',
                        color: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-3)' : index === 2 ? '#b45309' : 'var(--border-strong)'
                      }}>
                        #{index + 1}
                      </span>
                      <div className="avatar avatar--sm" style={{ border: index === 0 ? '2px solid var(--warning)' : 'none' }}>
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={person.name} />
                        ) : (
                          person.name.charAt(0)
                        )}
                      </div>
                      <div className="avatar-row__meta">
                        <b style={{ fontSize: '0.92rem', color: 'var(--ink-900)' }}>{person.name}</b>
                      </div>
                    </div>
                    <span className="text-3" style={{ fontWeight: 700, color: 'var(--brand-blue-600)' }}>
                      {formatNumber(person.score ?? 0)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}