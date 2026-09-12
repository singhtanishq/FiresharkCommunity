import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leaderboardApi } from '../api/endpoints'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'
import { 
  Trophy, Medal, Crown, CalendarDays, 
  MessageCircle, Target, ArrowRight, Zap 
} from 'lucide-react'
import type { LeaderboardPerson } from '../types'

type Board = 'contributors' | 'askers' | 'answerers'

const BOARD_LABELS: Record<Board, { label: string; icon: React.ReactNode }> = {
  contributors: { label: 'Top Contributors', icon: <Zap size={16} /> },
  askers: { label: 'Top Askers', icon: <Target size={16} /> },
  answerers: { label: 'Top Answerers', icon: <MessageCircle size={16} /> },
}

export function Leaderboard() {
  const [data, setData] = useState<any>(null)
  const [board, setBoard] = useState<Board>('contributors')
  const [scope, setScope] = useState<'month' | 'all_time'>('month')
  const [archiveMonth, setArchiveMonth] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    leaderboardApi.index(archiveMonth || undefined)
      .then((res) => {
        setData(res)
        setScope(archiveMonth ? 'month' : scope)
      })
      .finally(() => setLoading(false))
  }, [archiveMonth])

  if (loading && !data) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>
  if (!data) return null

  const isArchive = Boolean(archiveMonth) && !data.period.is_current
  const rows: LeaderboardPerson[] = isArchive
    ? (data[board] ?? [])
    : scope === 'all_time'
      ? (data.all_time?.contributors ?? [])
      : (data[board] ?? [])

  const valueFor = (row: LeaderboardPerson): { label: string; value: number } => {
    if (isArchive) {
      if (board === 'contributors') return { label: 'Points', value: row.score ?? 0 }
      if (board === 'askers') return { label: 'Questions', value: row.questions_count ?? 0 }
      return { label: 'Answers', value: row.answers_count ?? 0 }
    }
    if (scope === 'all_time' || board === 'contributors') return { label: 'Points', value: row.score ?? row.reputation ?? 0 }
    if (board === 'askers') return { label: 'Questions', value: row.questions_count ?? 0 }
    return { label: 'Answers', value: row.answers_count ?? 0 }
  }

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Premium Header */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both', width: '100%', boxSizing: 'border-box' }}>
        <div className="row" style={{ gap: '1.25rem', flex: '1 1 280px', minWidth: 0, flexWrap: 'wrap' }}>
          <div 
            style={{ 
              width: '64px', height: '64px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', 
              color: '#d97706', 
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
              flexShrink: 0
            }}
          >
            <Trophy size={32} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em', color: 'var(--ink-900)', wordBreak: 'break-word' }}>
              Hall of Fame
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {isArchive
                ? `Finalized official standings for ${data.period.period_key}.`
                : `Active monthly competition — currently in ${data.period.period_key}.`}
            </p>
          </div>
        </div>

        {/* Archive Selector */}
        {data.archive && data.archive.length > 0 && (
          <div className="input-affix" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: '240px', flexShrink: 0 }}>
            <CalendarDays className="input-affix__icon" size={16} />
            <select
              className="select input--with-affix"
              style={{ paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none', fontWeight: 600, width: '100%', boxSizing: 'border-box' }}
              value={archiveMonth}
              onChange={(e) => setArchiveMonth(e.target.value)}
              aria-label="Leaderboard month"
            >
              <option value="">Current Month</option>
              {data.archive.map((p: { period_key: string }) => (
                <option key={p.period_key} value={p.period_key}>{p.period_key} Archive</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Segmented Navigation */}
      {!isArchive && (
        <div className="row" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', animation: 'fade-in var(--dur-slow) var(--ease) 0.15s both', width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
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
            {(Object.keys(BOARD_LABELS) as Board[]).map((key) => {
              const isActive = scope === 'month' && board === key
              return (
                <Link
                  key={key}
                  to="#"
                  onClick={(e) => { e.preventDefault(); setBoard(key); setScope('month') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderRadius: 'calc(var(--radius) - 2px)',
                    color: isActive ? 'var(--brand-blue-700)' : 'var(--text-2)',
                    background: isActive ? '#fff' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    textDecoration: 'none',
                    transition: 'all var(--dur-fast) var(--ease)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{BOARD_LABELS[key].icon}</span>
                  <span>{BOARD_LABELS[key].label}</span>
                </Link>
              )
            })}
            <div style={{ width: '1px', background: 'var(--border)', margin: '0.4rem 0.2rem', flexShrink: 0 }} />
            <Link
              to="#"
              onClick={(e) => { e.preventDefault(); setScope('all_time') }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1.1rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: 'calc(var(--radius) - 2px)',
                color: scope === 'all_time' ? 'var(--brand-blue-700)' : 'var(--text-2)',
                background: scope === 'all_time' ? '#fff' : 'transparent',
                boxShadow: scope === 'all_time' ? 'var(--shadow-sm)' : 'none',
                textDecoration: 'none',
                transition: 'all var(--dur-fast) var(--ease)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Trophy size={16} style={{ opacity: scope === 'all_time' ? 1 : 0.6, flexShrink: 0 }} />
              <span>All-Time Global</span>
            </Link>
          </div>
        </div>
      )}

      {/* Leaderboard Data */}
      <div className="panel" style={{ padding: '0', overflow: 'hidden', animation: 'modal-rise var(--dur-slow) var(--ease) 0.2s both', width: '100%', boxSizing: 'border-box' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '4rem 2rem' }}>
            <EmptyState
              icon={<Trophy size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />}
              title="Awaiting the first contenders."
              action={<Link to="/questions/unanswered" className="btn btn--fire" style={{ flexWrap: 'wrap', justifyContent: 'center' }}><span>Answer open questions</span> <ArrowRight size={16} style={{ flexShrink: 0 }}/></Link>}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', width: '80px', color: 'var(--text-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Rank</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elite Member</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{valueFor(rows[0]).label}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isGold = index === 0
                  const isSilver = index === 1
                  const isBronze = index === 2
                  
                  // SAFETY FALLBACKS: Handle nested user objects or deleted users securely
                  const safeName = row.name || (row as any).user?.name || 'Unknown Member'
                  const safeUsername = row.username || (row as any).user?.username || `unknown-${index}`
                  const safeAvatar = row.avatar_path || (row as any).user?.avatar_path || undefined
                  const safeReputation = row.all_time_reputation ?? (row as any).user?.all_time_reputation

                  return (
                    <tr 
                      key={safeUsername} 
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        background: isGold ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)' : 'transparent',
                        transition: 'background var(--dur) var(--ease)'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = isGold ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%)' : 'var(--surface-2)'}
                      onMouseOut={e => e.currentTarget.style.background = isGold ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)' : 'transparent'}
                    >
                      {/* Rank Column */}
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        {isGold ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', flexShrink: 0 }}>
                            <Crown size={18} strokeWidth={2.5} />
                          </div>
                        ) : isSilver ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#f1f5f9', color: '#64748b', borderRadius: '50%', flexShrink: 0 }}>
                            <Medal size={18} strokeWidth={2.5} />
                          </div>
                        ) : isBronze ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#ffedd5', color: '#b45309', borderRadius: '50%', flexShrink: 0 }}>
                            <Medal size={18} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-3)', paddingLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                            #{index + 1}
                          </span>
                        )}
                      </td>

                      {/* User Column */}
                      <td style={{ padding: '1rem 1.5rem', minWidth: 0 }}>
                        <Link to={`/users/${safeUsername}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', minWidth: 0 }}>
                          <div style={{ border: isGold ? '2px solid #fbbf24' : isSilver ? '2px solid #cbd5e1' : isBronze ? '2px solid #fdba74' : 'none', borderRadius: '50%', padding: '2px', flexShrink: 0 }}>
                            <Avatar name={safeName} path={safeAvatar} size="md" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isGold ? '#b45309' : 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {safeName}
                            </span>
                            {safeReputation !== undefined && (
                              <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {formatNumber(safeReputation)} All-time Reputations
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Score Column */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: 800, 
                          color: isGold ? '#d97706' : 'var(--brand-blue-600)',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {formatNumber(valueFor(row).value)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="banner banner--info mt-3" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.3s both', boxSizing: 'border-box' }}>
        <Zap size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ wordBreak: 'break-word' }}>
          The monthly leaderboard resets on the 1st of each month — previous months are permanently archived. Rewards, when offered, are announced by the FireShark team.
        </span>
      </div>
    </div>
  )
}