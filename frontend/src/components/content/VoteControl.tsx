import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { votesApi } from '../../api/endpoints'
import { apiError } from '../../api/client'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function VoteControl({ votableType, votableId, authorId, score, myVote, onVoted }: {
  votableType: 'question' | 'answer'
  votableId: number
  authorId: number
  score: number
  myVote: number
  onVoted: (myVote: number, score: number) => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isOwn = user?.id === authorId

  const vote = async (value: 1 | -1) => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }
    try {
      const result = await votesApi.store(votableType, votableId, value)
      onVoted(result.data.my_vote, result.data.votes_score)
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  return (
    <div className="vote-control" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      
      {/* Upvote Button */}
      <button
        type="button"
        className={`vote-btn ${myVote === 1 ? 'is-up' : ''}`}
        onClick={() => vote(1)}
        disabled={isOwn}
        aria-label="Upvote"
        title={isOwn ? 'You cannot vote on your own content' : 'Upvote'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius)',
          border: '1px solid',
          borderColor: myVote === 1 ? 'var(--brand-blue-600)' : 'var(--border-strong)',
          background: myVote === 1 ? 'var(--brand-blue-600)' : 'var(--surface)',
          color: myVote === 1 ? '#fff' : 'var(--text-2)',
          display: 'grid',
          placeItems: 'center',
          cursor: isOwn ? 'not-allowed' : 'pointer',
          opacity: isOwn ? 0.4 : 1,
          transition: 'all var(--dur-fast) var(--ease)',
          boxShadow: myVote === 1 ? '0 4px 12px rgba(22, 122, 201, 0.25)' : 'var(--shadow-xs)'
        }}
      >
        <ChevronUp size={20} strokeWidth={2.5} />
      </button>

      {/* Score Indicator */}
      <span 
        className="vote-control__score" 
        aria-live="polite"
        style={{ 
          fontWeight: 800, 
          fontSize: '1.1rem', 
          color: myVote === 1 ? 'var(--brand-blue-600)' : myVote === -1 ? 'var(--danger)' : 'var(--ink-900)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          padding: '0.2rem 0'
        }}
      >
        {score}
      </span>

      {/* Downvote Button */}
      <button
        type="button"
        className={`vote-btn ${myVote === -1 ? 'is-down' : ''}`}
        onClick={() => vote(-1)}
        disabled={isOwn}
        aria-label="Downvote"
        title={isOwn ? 'You cannot vote on your own content' : 'Downvote'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius)',
          border: '1px solid',
          borderColor: myVote === -1 ? 'var(--danger)' : 'var(--border-strong)',
          background: myVote === -1 ? 'var(--danger)' : 'var(--surface)',
          color: myVote === -1 ? '#fff' : 'var(--text-2)',
          display: 'grid',
          placeItems: 'center',
          cursor: isOwn ? 'not-allowed' : 'pointer',
          opacity: isOwn ? 0.4 : 1,
          transition: 'all var(--dur-fast) var(--ease)',
          boxShadow: myVote === -1 ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'var(--shadow-xs)'
        }}
      >
        <ChevronDown size={20} strokeWidth={2.5} />
      </button>
      
    </div>
  )
}