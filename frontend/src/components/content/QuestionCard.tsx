import { Link } from 'react-router-dom'
import type { Question } from '../../types'
import { formatNumber, timeAgo, verificationLabels } from '../../lib/format'

export function QuestionCard({ question }: { question: Question }) {
  return (
    <article className="panel q-card">
      <div className="q-card__stats">
        <div className="q-stat q-stat--votes">
          <b>{formatNumber(question.votes_score)}</b>
          <span>votes</span>
        </div>
        <div className={`q-stat q-stat--answers ${question.is_solved ? 'is-accepted' : ''}`}>
          <b>{formatNumber(question.answers_count)}</b>
          <span>{question.answers_count === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="q-stat">
          <b>{formatNumber(question.views)}</b>
          <span>views</span>
        </div>
      </div>

      <div>
        <h3 className="q-card__title">
          <Link to={`/questions/${question.slug}`}>{question.title}</Link>
          {question.status === 'closed' && <span className="muted" style={{ marginLeft: 6 }}>[closed]</span>}
        </h3>

        {question.excerpt && <p className="q-card__excerpt">{question.excerpt}</p>}

        <div className="q-card__meta">
          {question.is_solved && (
            <span className="solved-flag" title="This question has an accepted answer">
              <span className="solved-flag__dot" /> Solved
            </span>
          )}
          {question.tags.map((tag) => (
            <Link key={tag.id} className="chip" to={`/tags/${tag.slug}`}>{tag.name}</Link>
          ))}
          <span style={{ marginLeft: 'auto' }} className="row" >
            <Link to={`/users/${question.user.username}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-blue-600)',
                  color: '#fff', fontSize: 11, display: 'inline-grid', placeItems: 'center', fontWeight: 700,
                }}
                aria-hidden="true"
              >
                {question.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontWeight: 600 }}>{question.user.name}</span>
              {question.user.verification && (
                <span className="verified-chip" title={verificationLabels[question.user.verification]}>
                  ✓ {verificationLabels[question.user.verification]}
                </span>
              )}
            </Link>
            <span className="muted">asked {timeAgo(question.created_at)}</span>
          </span>
        </div>
      </div>
    </article>
  )
}
