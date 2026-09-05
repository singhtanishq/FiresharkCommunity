import { Link } from 'react-router-dom'
import type { Question } from '../../types'
import { formatNumber, timeAgo } from '../../lib/format'

export function QuestionCard({ question }: { question: Question }) {
  return (
    <article className="panel question-card">
      <div className="question-card__stats">
        <div className="stat-bubble stat-bubble--votes" title="Votes">
          <b>{formatNumber(question.votes_score)}</b> votes
        </div>
        <div className={`stat-bubble stat-bubble--answers ${question.is_solved ? 'is-accepted' : ''}`} title="Answers">
          <b>{formatNumber(question.answers_count)}</b> {question.answers_count === 1 ? 'answer' : 'answers'}
        </div>
        <div title="Views">
          <b>{formatNumber(question.views)}</b> views
        </div>
      </div>

      <div>
        <h3 className="question-card__title">
          <Link to={`/questions/${question.slug}`}>{question.title}</Link>
          {question.status === 'closed' && <span className="muted"> [closed]</span>}
        </h3>

        {question.excerpt && <p className="question-card__excerpt">{question.excerpt}</p>}

        <div className="question-card__meta">
          {question.is_solved && (
            <span className="solved-badge" title="This question has an accepted answer">✓ Solved</span>
          )}
          {question.tags.map((tag) => (
            <Link key={tag.id} className="tag-chip" to={`/tags/${tag.slug}`}>{tag.name}</Link>
          ))}
          <span className="row" style={{ gap: '0.35rem', marginLeft: 'auto' }}>
            <Link to={`/users/${question.user.username}`}>{question.user.name}</Link>
            <span>asked {timeAgo(question.created_at)}</span>
          </span>
        </div>
      </div>
    </article>
  )
}
