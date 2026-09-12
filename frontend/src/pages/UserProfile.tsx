import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usersApi } from '../api/endpoints'
import type { Answer, Badge, Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatDate, formatNumber, verificationLabels } from '../lib/format'
import { 
  User, Award, MessageSquare, Lightbulb, CheckCircle2, 
  MapPin, Globe, Calendar, Briefcase, Zap, ShieldCheck, 
  ChevronRight, Star
} from 'lucide-react'

type Tab = 'questions' | 'answers'

export function UserProfile() {
  const { username = '' } = useParams()
  const [profile, setProfile] = useState<(Question | any) & { badges?: Badge[] } | null>(null)
  const [tab, setTab] = useState<Tab>('questions')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(Answer & { question?: { slug: string; title: string; is_solved: boolean } })[]>([])
  const [qMeta, setQMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [aMeta, setAMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    usersApi.show(username)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    usersApi.questions(username).then((res) => {
      setQuestions(res.data)
      setQMeta(res.meta)
    })
    usersApi.answers(username).then((res) => {
      setAnswers(res.data)
      setAMeta(res.meta)
    })
  }, [username])

  if (notFound) {
    return (
      <div className="panel" style={{ padding: '4rem 2rem', marginTop: '2rem' }}>
        <EmptyState 
          icon={<User size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} 
          title="Profile not found." 
          action={<Link to="/questions" className="btn btn--primary">Return to Feed</Link>}
        />
      </div>
    )
  }
  
  if (loading || !profile) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Premium Profile Header */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both', width: '100%', boxSizing: 'border-box' }}>
        {/* Top Banner Gradient */}
        <div style={{ height: '110px', marginBottom: '-0.5rem', background: 'linear-gradient(135deg, var(--brand-blue-600), var(--brand-blue-700))', width: '100%', boxSizing: 'border-box' }} />
        
        <div style={{ padding: '0 clamp(1rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          
          <div className="row" style={{ alignItems: 'flex-end', gap: '1.5rem', marginTop: '-48px', marginBottom: '1.5rem', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ border: '4px solid var(--surface)', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
              <div style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}>
                <Avatar name={profile.name} path={profile.avatar_path} size="lg" />
              </div>
            </div>
            
            <div style={{ flex: '1 1 245px', minWidth: 0, paddingBottom: '0.2rem', boxSizing: 'border-box' }}>
              <h1 className="row" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 0.4rem', color: '#fff', gap: '0.6rem', flexWrap: 'wrap', textShadow: '0 2px 4px rgba(0,0,0,0.15)', wordBreak: 'break-word' }}>
                <span>{profile.name}</span>
                {profile.verification && (
                  <span className="chip" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--brand-blue-700)', border: 'none', fontSize: '0.8rem', padding: '0.2rem 0.6rem', textShadow: 'none', flexShrink: 0 }}>
                    <ShieldCheck size={14} style={{ flexShrink: 0 }} /> {verificationLabels[profile.verification] ?? 'Verified'}
                  </span>
                )}
                {(profile.role === 'admin' || profile.role === 'moderator') && (
                  <span className="chip" style={{ background: '#fff1e8', color: '#c2410c', border: '1px solid #fed7aa', fontSize: '0.8rem', padding: '0.2rem 0.6rem', textShadow: 'none', flexShrink: 0 }}>
                    {profile.role === 'admin' ? 'Administrator' : 'Moderator'}
                  </span>
                )}
              </h1>
              
              <div className="row" style={{ gap: '1rem', color: 'var(--text-2)', fontSize: '0.92rem', flexWrap: 'wrap', marginTop: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                {profile.expertise && (
                  <span className="row" style={{ gap: '0.35rem', flexShrink: 0 }}><Briefcase size={14} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>{profile.expertise}</span></span>
                )}
                {profile.location && (
                  <span className="row" style={{ gap: '0.35rem', flexShrink: 0 }}><MapPin size={14} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>{profile.location}</span></span>
                )}
                {profile.website && (
                  <span className="row" style={{ gap: '0.35rem', flexShrink: 0, maxWidth: '100%' }}>
                    <Globe size={14} style={{ flexShrink: 0 }} /> 
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', wordBreak: 'break-all' }}>
                      {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </span>
                )}
                <span className="row" style={{ gap: '0.35rem', flexShrink: 0 }}>
                  <Calendar size={14} style={{ flexShrink: 0 }} /> <span>Member since {formatDate(profile.member_since ?? profile.created_at)}</span>
                </span>
              </div>
            </div>
          </div>
          
          {profile.bio && (
            <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--ink-800)', maxWidth: '800px', marginBottom: '1.5rem', background: 'var(--surface-2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--border-strong)', wordBreak: 'break-word', width: '100%', boxSizing: 'border-box' }}>
              {profile.bio}
            </div>
          )}

          {/* Profile Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="panel" style={{ padding: '1rem', border: '1px solid var(--brand-blue-100)', background: 'var(--brand-blue-50)', boxSizing: 'border-box' }}>
              <div className="row" style={{ gap: '0.4rem', color: 'var(--brand-blue-700)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', flexWrap: 'nowrap' }}>
                <Zap size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Reputation</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-blue-700)', lineHeight: 1, wordBreak: 'break-word' }}>
                {formatNumber(profile.reputation)}
              </div>
            </div>
            
            <div className="panel" style={{ padding: '1rem', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
              <div className="row" style={{ gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', flexWrap: 'nowrap' }}>
                <MessageSquare size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Questions</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1, wordBreak: 'break-word' }}>
                {formatNumber(profile.questions_count)}
              </div>
            </div>

            <div className="panel" style={{ padding: '1rem', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
              <div className="row" style={{ gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', flexWrap: 'nowrap' }}>
                <Lightbulb size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Answers</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1, wordBreak: 'break-word' }}>
                {formatNumber(profile.answers_count)}
              </div>
            </div>

            <div className="panel" style={{ padding: '1rem', border: '1px solid #bbf7d0', background: 'var(--success-bg)', boxSizing: 'border-box' }}>
              <div className="row" style={{ gap: '0.4rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', flexWrap: 'nowrap' }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Accepted</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1, wordBreak: 'break-word' }}>
                {formatNumber(profile.accepted_answers_count)}
              </div>
            </div>
            
            <div className="panel" style={{ padding: '1rem', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
              <div className="row" style={{ gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', flexWrap: 'nowrap' }}>
                <Star size={14} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Badges</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1, wordBreak: 'break-word' }}>
                {formatNumber(profile.badges?.length ?? 0)}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Badges Collection */}
      {(profile.badges?.length ?? 0) > 0 && (
        <div className="mb-4" style={{ animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', wordBreak: 'break-word' }}>
            <Award size={20} color="var(--brand-blue-600)" style={{ flexShrink: 0 }} /> <span>Earned Badges</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            {profile.badges.map((badge: Badge) => {
              const isGold = badge.tier === 'gold'
              const isSilver = badge.tier === 'silver'
              
              const bg = isGold ? '#fef3c7' : isSilver ? '#f1f5f9' : '#ffedd5'
              const color = isGold ? '#d97706' : isSilver ? '#64748b' : '#b45309'
              const border = isGold ? '#fde68a' : isSilver ? '#e2e8f0' : '#fed7aa'

              return (
                <div key={badge.id} className="panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'transform var(--dur) var(--ease)', border: `1px solid ${border}`, boxSizing: 'border-box', overflowX: 'hidden' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: bg, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Award size={24} strokeWidth={2.5} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ display: 'block', fontSize: '1rem', color: 'var(--ink-900)', marginBottom: '0.1rem', wordBreak: 'break-word' }}>{badge.name}</b>
                    <div className="muted" style={{ fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{badge.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Content Tabs & Feed */}
      <div style={{ marginTop: '2.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Segmented Control */}
        <div className="row" style={{ marginBottom: '1.5rem', width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
          <div 
            style={{ 
              background: 'var(--surface-2)', 
              padding: '0.3rem', 
              borderRadius: 'var(--radius)', 
              display: 'inline-flex', 
              gap: '0.2rem',
              border: '1px solid var(--border)',
              flexWrap: 'nowrap',
              boxSizing: 'border-box'
            }}
          >
            <button
              onClick={() => setTab('questions')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: 'calc(var(--radius) - 2px)',
                border: 'none',
                cursor: 'pointer',
                color: tab === 'questions' ? 'var(--brand-blue-700)' : 'var(--text-2)',
                background: tab === 'questions' ? '#fff' : 'transparent',
                boxShadow: tab === 'questions' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--dur-fast) var(--ease)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <MessageSquare size={16} style={{ flexShrink: 0 }} /> <span>Questions ({formatNumber(qMeta.total)})</span>
            </button>
            <button
              onClick={() => setTab('answers')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: 'calc(var(--radius) - 2px)',
                border: 'none',
                cursor: 'pointer',
                color: tab === 'answers' ? 'var(--brand-blue-700)' : 'var(--text-2)',
                background: tab === 'answers' ? '#fff' : 'transparent',
                boxShadow: tab === 'answers' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--dur-fast) var(--ease)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Lightbulb size={16} style={{ flexShrink: 0 }} /> <span>Answers ({formatNumber(aMeta.total)})</span>
            </button>
          </div>
        </div>

        {tab === 'questions' && (
          questions.length === 0 ? (
            <div className="panel" style={{ padding: '4rem 2rem', boxSizing: 'border-box' }}>
              <EmptyState icon={<MessageSquare size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} title="No questions asked yet." />
            </div>
          ) : (
            <div className="question-list" style={{ gap: '1rem', animation: 'fade-in var(--dur-fast) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
              {questions.map((question) => (
                <div key={question.id} style={{ transition: 'transform 0.3s ease', width: '100%', boxSizing: 'border-box' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <QuestionCard question={question} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'answers' && (
          answers.length === 0 ? (
            <div className="panel" style={{ padding: '4rem 2rem', boxSizing: 'border-box' }}>
              <EmptyState icon={<Lightbulb size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />} title="No answers posted yet." />
            </div>
          ) : (
            <div className="panel" style={{ padding: 0, overflow: 'hidden', animation: 'fade-in var(--dur-fast) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
              {answers.map((answer) => (
                <Link 
                  key={answer.id} 
                  to={`/questions/${answer.question?.slug}#answer-${answer.id}`}
                  style={{ 
                    display: 'block', padding: '1.25rem 1.5rem', 
                    borderBottom: '1px solid var(--border)', 
                    textDecoration: 'none', color: 'inherit',
                    transition: 'background var(--dur) var(--ease)',
                    boxSizing: 'border-box',
                    overflowX: 'hidden'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="row row--between mb-2" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
                      <span className="muted" style={{ fontWeight: 400, flexShrink: 0 }}>Response to:</span> 
                      <span style={{ wordBreak: 'break-word' }}>{answer.question?.title}</span>
                    </div>
                    {answer.question?.is_solved && (
                      <span className="chip" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #bbf7d0', padding: '0.1rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}>
                        <CheckCircle2 size={12} style={{ flexShrink: 0 }} /> Solved
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-strong)', wordBreak: 'break-word', width: '100%', boxSizing: 'border-box' }}>
                    {answer.body.replace(/[#*`>\n]/g, ' ').slice(0, 240)}{answer.body.length > 240 ? '...' : ''}
                  </div>
                  
                  <div className="row mt-2" style={{ color: 'var(--brand-blue-600)', fontSize: '0.85rem', fontWeight: 600, gap: '0.3rem', flexWrap: 'nowrap' }}>
                    <span>View full answer</span> <ChevronRight size={14} style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}