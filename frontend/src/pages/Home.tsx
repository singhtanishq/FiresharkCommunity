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
  FolderOpen, Zap, Flame, Hexagon, ArrowRight
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  shield: Shield, terminal: Terminal, crosshair: Crosshair, bug: Bug,
  network: Network, cloud: Cloud, radar: Radar, target: Target, globe: Globe,
  api: Cpu, search: Search, alert: AlertTriangle, tool: Wrench, certificate: Award,
  briefcase: Briefcase, flask: FlaskConical,
}

function CategoryIcon({ icon, size = 20, className = "" }: { icon: string | null; size?: number, className?: string }) {
  const Icon = CATEGORY_ICONS[icon ?? ''] || FolderOpen
  return <Icon size={size} strokeWidth={1.5} className={className} />
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
    <div className="premium-home">
      {/* 
        INJECTED COMPONENT-LEVEL STYLES
        This transforms the basic global CSS into a high-end, animated spatial interface.
      */}
      <style>{`
        .premium-home {
          --glass-bg: rgba(255, 255, 255, 0.7);
          --glass-border: rgba(255, 255, 255, 0.4);
          --neon-blue: #3292D3;
          --neon-glow: rgba(50, 146, 211, 0.4);
          padding-bottom: 6rem;
        }

        /* Animations */
        @keyframes revealUp {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(22, 122, 201, 0.2); }
          50% { box-shadow: 0 0 40px rgba(22, 122, 201, 0.5); }
        }
        @keyframes shimmer {
          100% { mask-position: 200% center; -webkit-mask-position: 200% center; }
        }

        .anim-reveal-1 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-reveal-2 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .anim-reveal-3 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .anim-reveal-4 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both; }

        /* Super Premium Hero */
        .showstopper-hero {
          position: relative;
          border-radius: 32px;
          background: linear-gradient(145deg, #0b1220 0%, #0d1a30 50%, #112948 100%);
          padding: 6rem 3rem 8rem;
          text-align: center;
          overflow: hidden;
          margin-bottom: -4rem; /* Negative margin to pull stats up */
          box-shadow: 0 30px 60px -12px rgba(11, 18, 32, 0.4);
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .showstopper-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% -20%, rgba(100, 189, 229, 0.2), transparent 60%);
          pointer-events: none;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffffff 20%, #64BDE5 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        .search-glass {
          max-width: 720px;
          margin: 3rem auto 0;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 99px;
          padding: 0.6rem;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .search-glass:focus-within {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(100, 189, 229, 0.4);
          box-shadow: 0 0 30px rgba(50, 146, 211, 0.2);
          transform: translateY(-2px);
        }
        .search-glass input {
          flex: 1; background: transparent; border: none; color: #fff;
          font-size: 1.15rem; padding: 0.5rem 1.5rem; outline: none;
        }
        .search-glass input::placeholder { color: rgba(255,255,255,0.4); }

        /* Floating Stats overlapping hero */
        .floating-stats {
          position: relative;
          z-index: 10;
          max-width: 1000px;
          margin: 0 auto 4rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          padding: 0 2rem;
        }
        .stat-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 1);
          border-radius: 20px;
          padding: 1.8rem;
          text-align: center;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.08), 
                      inset 0 1px 0 rgba(255, 255, 255, 1);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .stat-glass:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 50px -10px rgba(22, 122, 201, 0.15);
        }
        .stat-glass b { display: block; font-size: 2.2rem; font-weight: 800; color: var(--ink-900); letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.5rem; }
        .stat-glass span { font-size: 0.85rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }

        /* Category Bento Row */
        .category-bento {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 1rem 0 2rem;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .category-bento::-webkit-scrollbar { display: none; }
        .bento-pill {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 0.75rem 1.25rem 0.75rem 0.75rem;
          border-radius: 99px;
          text-decoration: none;
          color: var(--ink-900);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          scroll-snap-align: start;
        }
        .bento-pill:hover {
          background: var(--brand-blue-50);
          border-color: var(--brand-blue-400);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 24px -8px rgba(22, 122, 201, 0.2);
        }
        .bento-icon-wrap {
          background: #fff;
          border-radius: 50%;
          width: 40px; height: 40px;
          display: grid; place-items: center;
          color: var(--brand-blue-600);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        /* Leaderboard Pro Card */
        .pro-leaderboard {
          background: linear-gradient(180deg, var(--ink-900) 0%, var(--ink-800) 100%);
          border-radius: 24px;
          color: #fff;
          padding: 2rem;
          position: sticky;
          top: 100px;
          box-shadow: var(--shadow-lg);
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .pro-leaderboard::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #f2600c, var(--brand-blue-500), #64BDE5);
        }
        .leader-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: transform 0.2s ease;
        }
        .leader-row:hover { transform: translateX(8px); }
        .leader-row:last-child { border-bottom: none; }
        
        .glow-btn {
          background: linear-gradient(135deg, var(--brand-blue-600), var(--brand-blue-500));
          box-shadow: 0 0 20px rgba(50, 146, 211, 0.4);
          color: #fff !important;
          border: none;
        }
        .glow-btn:hover {
          animation: pulseGlow 1.5s infinite;
          transform: translateY(-2px);
        }
      `}</style>

      {/* --- HERO SECTION --- */}
      <section className="showstopper-hero anim-reveal-1">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '99px', color: '#64BDE5', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2rem' }}>
          <Flame size={16} color="#f2600c" /> Welcome to the Elite
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 900, lineHeight: 1.05, color: '#fff', maxWidth: '900px', margin: '0 auto 1.5rem', letterSpacing: '-0.03em' }}>
          Ask questions. Share knowledge. <br />
          <span className="gradient-text">Master the infrastructure.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Join top cybersecurity engineers, ethical hackers, and sysadmins in the most active, peer-reviewed knowledge network on the web.
        </p>

        <form className="search-glass" onSubmit={submit}>
          <Search color="rgba(255, 255, 255, 0.4)" size={24} style={{ marginLeft: '1rem' }} />
          <input
            value={heroQ}
            onChange={(e) => setHeroQ(e.target.value)}
            placeholder="Search Nmap, Burp, AWS IAM, vulnerabilities..."
            autoComplete="off"
          />
          <button className="btn glow-btn" style={{ borderRadius: '99px', padding: '0.8rem 1.8rem', fontSize: '1rem' }} type="submit" disabled={!heroQ.trim()}>
            Explore
          </button>
        </form>
      </section>

      {/* --- OVERLAPPING STATS --- */}
      {stats && (
        <section className="floating-stats anim-reveal-2" aria-label="Community stats">
          <div className="stat-glass" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <b>{formatNumber(stats.total)}</b>
            <span>Active Queries</span>
          </div>
          <div className="stat-glass" style={{ animation: 'float 6s ease-in-out infinite 0.5s' }}>
            <b>{formatNumber(stats.totalAnswers)}</b>
            <span>Verified Answers</span>
          </div>
          <div className="stat-glass" style={{ animation: 'float 6s ease-in-out infinite 1s' }}>
            <b>{formatNumber(stats.users)}</b>
            <span>Engineers</span>
          </div>
          <div className="stat-glass" style={{ background: 'linear-gradient(135deg, #167AC9, #3292D3)', borderColor: 'transparent', color: '#fff', animation: 'float 6s ease-in-out infinite 1.5s' }}>
            <b style={{ color: '#fff' }}>{formatNumber(top.length > 0 ? top[0].score ?? 0 : 0)}</b>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Top Score (MTD)</span>
          </div>
        </section>
      )}

      <div className="app-main">
        {/* --- SCROLLING BENTO CATEGORIES --- */}
        <div className="anim-reveal-3" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hexagon size={24} color="var(--brand-blue-500)" /> Hot Ecosystems
            </h2>
            <Link to="/categories" className="btn btn--quiet btn--sm">View Catalog <ArrowRight size={14} /></Link>
          </div>
          
          <div className="category-bento">
            {categories.slice(0, 10).map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} className="bento-pill">
                <div className="bento-icon-wrap">
                  <CategoryIcon icon={cat.icon} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 }}>{formatNumber(cat.questions_count)} DISCUSSIONS</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* --- MAIN CONTENT & LEADERBOARD --- */}
        <div className="grid-3 anim-reveal-4">
          
          <section>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Live Feed</h1>
                <p style={{ fontSize: '1.05rem' }}>Real-time peer discussions and intelligence.</p>
              </div>
              <Link to="/ask" className="btn glow-btn">
                <Zap size={16} /> Ignite Discussion
              </Link>
            </div>

            {loading ? (
              <Spinner />
            ) : questions.length === 0 ? (
              <div className="panel" style={{ padding: '4rem 2rem' }}>
                <EmptyState
                  icon={<MessageSquare size={48} color="var(--brand-blue-400)" strokeWidth={1} />}
                  title="The feed is pristine."
                  action={<Link to="/ask" className="btn btn--fire">Ask the first question</Link>}
                />
              </div>
            ) : (
              <div className="question-list" style={{ gap: '1.2rem' }}>
                {questions.map((question) => (
                  <div key={question.id} style={{ transition: 'all 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <QuestionCard question={question} />
                  </div>
                ))}
                <Link to="/questions" className="btn btn--ghost btn--block mt-2" style={{ padding: '1rem', borderStyle: 'dashed' }}>
                  Load More Intelligence
                </Link>
              </div>
            )}
          </section>

          <aside>
            {!loading && top.length > 0 && (
              <div className="pro-leaderboard">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ color: '#fff', fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award color="#f2600c" /> Elite Board
                  </h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {top.map((person, index) => (
                    <Link key={person.id} to={`/profile/${person.username}`} className="leader-row" style={{ textDecoration: 'none' }}>
                      <div className="row" style={{ gap: '1rem' }}>
                        <span style={{ 
                          fontSize: '1.2rem', fontWeight: 900, width: '24px',
                          color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.2)'
                        }}>
                          {index + 1}
                        </span>
                        <div className="avatar" style={{ border: index === 0 ? '2px solid #fbbf24' : 'none' }}>
                          {person.avatar_url ? <img src={person.avatar_url} alt={person.name} /> : person.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>{person.name}</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700, color: '#64BDE5', fontSize: '0.85rem' }}>
                        {formatNumber(person.score ?? 0)}
                      </div>
                    </Link>
                  ))}
                </div>
                
                <Link to="/leaderboard" className="btn btn--quiet btn--block" style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}>
                  View Global Ranks
                </Link>
              </div>
            )}
          </aside>
          
        </div>
      </div>
    </div>
  )
}