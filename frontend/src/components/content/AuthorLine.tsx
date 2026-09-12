import { Link } from 'react-router-dom'
import type { UserSummary } from '../../types'
import { formatNumber, verificationLabels } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { ShieldCheck, Zap } from 'lucide-react'

/** Premium author line used under questions, answers, and comments. */
export function AuthorLine({ user, prefix, date }: { user: UserSummary; prefix?: string; date?: string }) {
  return (
    <div className="row" style={{ gap: '0.5rem', display: 'inline-flex', alignItems: 'center' }}>
      
      {/* Interactive Avatar Wrapper */}
      <Link 
        to={`/users/${user.username}`} 
        style={{ display: 'flex', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1) translateY(-1px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'none'}
      >
        <Avatar name={user.name} path={user.avatar_path} size="sm" />
      </Link>
      
      <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        {prefix && <span className="muted" style={{ fontWeight: 500 }}>{prefix}</span>}
        
        {/* Name with subtle color transition */}
        <Link 
          to={`/users/${user.username}`} 
          style={{ 
            fontWeight: 700, 
            color: 'var(--ink-900)',
            textDecoration: 'none',
            transition: 'color var(--dur-fast) var(--ease)'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue-600)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--ink-900)'}
        >
          {user.name}
        </Link>
        
        {/* Premium Verification Chip */}
        {user.verification && (
          <span 
            className="chip" 
            title={verificationLabels[user.verification] ?? 'Verified'} 
            style={{ 
              background: 'var(--brand-blue-50)', 
              color: 'var(--brand-blue-700)', 
              border: 'none', 
              padding: '0.15rem 0.45rem', 
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginLeft: '0.1rem'
            }}
          >
            <ShieldCheck size={12} strokeWidth={2.5} /> 
            {verificationLabels[user.verification] ?? 'Verified'}
          </span>
        )}
        
        {/* Styled Separator & Date */}
        {date && (
          <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{ opacity: 0.4, fontSize: '0.6rem' }}>●</span> {date}
          </span>
        )}
      </span>
    </div>
  )
}

/** Gamified reputation pill shown next to user links or inside profiles. */
export function ReputationPill({ reputation }: { reputation: number }) {
  return (
    <span 
      className="chip" 
      title="Community Reputation Score"
      style={{ 
        fontSize: '0.75rem', 
        fontWeight: 800, 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        color: 'var(--brand-blue-700)',
        background: 'linear-gradient(135deg, var(--brand-blue-50) 0%, #d8ebfb 100%)',
        border: '1px solid var(--brand-blue-100)',
        padding: '0.15rem 0.5rem',
        boxShadow: '0 1px 2px rgba(22, 122, 201, 0.05)'
      }}
    >
      <Zap size={12} fill="currentColor" strokeWidth={2} />
      {formatNumber(reputation)}
    </span>
  )
}