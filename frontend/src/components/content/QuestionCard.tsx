import { Link } from 'react-router-dom'
import type { Question } from '../../types'
import { formatNumber, timeAgo, verificationLabels } from '../../lib/format'
import { CheckCircle2, Lock, Eye, MessageSquare, ThumbsUp, ShieldCheck } from 'lucide-react'

export function QuestionCard({ question }: { question: Question }) {
  const isClosed = question.status === 'closed'

  return (
    <article 
      className="panel q-card"
      style={{ 
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: '1.5rem',
        padding: '1.25rem 1.5rem',
        alignItems: 'start',
        border: question.is_solved ? '1px solid #bbf7d0' : '1px solid var(--border)',
        background: question.is_solved ? 'linear-gradient(90deg, rgba(236, 253, 243, 0.4) 0%, var(--surface) 20%)' : 'var(--surface)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--brand-blue-400)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
        e.currentTarget.style.borderColor = question.is_solved ? '#bbf7d0' : 'var(--border)'
      }}
    >
      {/* Metrics Column */}
      <div className="q-card__stats" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        
        {/* Votes Score */}
        <div 
          className="q-stat q-stat--votes" 
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            padding: '0.4rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)',
            border: '1px solid var(--border)' 
          }}
        >
          <b style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-blue-600)', lineHeight: 1 }}>
            {formatNumber(question.votes_score)}
          </b>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginTop: '2px' }}>
            votes
          </span>
        </div>

        {/* Answers Count */}
        <div 
          className={`q-stat q-stat--answers ${question.is_solved ? 'is-accepted' : ''}`}
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            padding: '0.4rem', borderRadius: 'var(--radius)', 
            background: question.is_solved ? 'var(--success-bg)' : 'var(--surface-2)',
            border: question.is_solved ? '1px solid #bbf7d0' : '1px solid var(--border)' 
          }}
        >
          <b style={{ fontSize: '1.1rem', fontWeight: 800, color: question.is_solved ? 'var(--success)' : 'var(--ink-900)', lineHeight: 1 }}>
            {formatNumber(question.answers_count)}
          </b>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: question.is_solved ? 'var(--success)' : 'var(--text-3)', marginTop: '2px' }}>
            {question.answers_count === 1 ? 'answer' : 'answers'}
          </span>
        </div>

        {/* Views Count */}
        <div 
          className="q-stat" 
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            padding: '0.3rem', borderRadius: 'var(--radius)', background: 'transparent',
            border: 'none', opacity: 0.8 
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-3)', lineHeight: 1 }}>
            {formatNumber(question.views)}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>
            views
          </span>
        </div>

      </div>

      {/* Main Content Column */}
      <div style={{ minWidth: 0 }}>
        
        {/* Title & Status Flags */}
        <h3 className="q-card__title" style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem', lineHeight: 1.4 }}>
          <Link 
            to={`/questions/${question.slug}`} 
            style={{ color: 'var(--ink-900)', transition: 'color var(--dur-fast) var(--ease)' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue-600)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--ink-900)'}
          >
            {question.title}
          </Link>
          {isClosed && (
            <span className="chip chip--ghost" style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.4rem', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
              <Lock size={12} style={{ display: 'inline', marginRight: '2px' }} /> Closed
            </span>
          )}
        </h3>

        {/* Excerpt */}
        {question.excerpt && (
          <p className="q-card__excerpt" style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {question.excerpt}
          </p>
        )}

        {/* Metadata Footer: Solved Flag, Tags & Author */}
        <div className="q-card__meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          
          {question.is_solved && (
            <span className="solved-flag" title="This question has an accepted answer" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} strokeWidth={2.5} /> Solved
            </span>
          )}

          {/* Tags */}
          {question.tags.map((tag) => (
            <Link key={tag.id} className="chip chip--ghost" to={`/tags/${tag.slug}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem' }}>
              {tag.name}
            </Link>
          ))}

          {/* Author info aligned to the right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link 
              to={`/users/${question.user.username}`} 
              className="row" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}
            >
              <div 
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-blue-600)',
                  color: '#fff', fontSize: '0.7rem', display: 'inline-grid', placeItems: 'center', fontWeight: 800,
                  boxShadow: 'var(--shadow-xs)'
                }}
                aria-hidden="true"
              >
                {question.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-800)' }}>{question.user.name}</span>
              
              {question.user.verification && (
                <span className="verified-chip" title={verificationLabels[question.user.verification]} style={{ fontSize: '0.68rem', padding: '0.05rem 0.4rem' }}>
                  <ShieldCheck size={10} strokeWidth={2.5} /> {verificationLabels[question.user.verification]}
                </span>
              )}
            </Link>
            
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              asked {timeAgo(question.created_at)}
            </span>
          </div>

        </div>

      </div>
    </article>
  )
}