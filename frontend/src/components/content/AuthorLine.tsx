import { Link } from 'react-router-dom'
import type { UserSummary } from '../../types'
import { formatNumber, verificationLabels } from '../../lib/format'
import { Avatar } from '../ui/Avatar'

/** Author line used under questions and answers. */
export function AuthorLine({ user, prefix, date }: { user: UserSummary; prefix?: string; date?: string }) {
  return (
    <span className="row" style={{ gap: '0.45rem' }}>
      <Avatar name={user.name} path={user.avatar_path} size="sm" />
      <span>
        {prefix && <span className="muted">{prefix} </span>}
        <Link to={`/users/${user.username}`} style={{ fontWeight: 600 }}>{user.name}</Link>
        {user.verification && (
          <span className="verified-chip" title={verificationLabels[user.verification] ?? 'Verified'} style={{ marginLeft: 6 }}>
            ✓ {verificationLabels[user.verification] ?? 'Verified'}
          </span>
        )}
        {date && <span className="muted"> · {date}</span>}
      </span>
    </span>
  )
}

/** Reputation pill shown next to user links. */
export function ReputationPill({ reputation }: { reputation: number }) {
  return (
    <span className="muted" title="Reputation">
      <b style={{ color: 'var(--ink-2)' }}>{formatNumber(reputation)}</b> rep
    </span>
  )
}
