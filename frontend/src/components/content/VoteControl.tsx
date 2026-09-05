import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { votesApi } from '../../api/endpoints'
import { apiError } from '../../api/client'

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
    if (! user) {
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
    <div className="vote-control">
      <button
        type="button"
        className={myVote === 1 ? 'is-up' : ''}
        onClick={() => vote(1)}
        disabled={isOwn}
        aria-label="Upvote"
        title={isOwn ? 'You cannot vote on your own content' : 'Upvote'}
      >
        ▲
      </button>
      <span className="vote-control__score" aria-live="polite">{score}</span>
      <button
        type="button"
        className={myVote === -1 ? 'is-down' : ''}
        onClick={() => vote(-1)}
        disabled={isOwn}
        aria-label="Downvote"
        title={isOwn ? 'You cannot vote on your own content' : 'Downvote'}
      >
        ▼
      </button>
    </div>
  )
}
