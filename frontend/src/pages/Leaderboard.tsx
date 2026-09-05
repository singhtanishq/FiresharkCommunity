import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leaderboardApi } from '../api/endpoints'
import type { LeaderboardPerson } from '../types'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatNumber } from '../lib/format'

type Board = 'contributors' | 'askers' | 'answerers'

const BOARD_LABELS: Record<Board, string> = {
  contributors: 'Top Contributors',
  askers: 'Top Askers',
  answerers: 'Top Answerers',
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

  if (loading && ! data) return <Spinner />
  if (! data) return null

  const isArchive = Boolean(archiveMonth) && ! data.period.is_current
  const rows: LeaderboardPerson[] = isArchive
    ? (data[board] ?? [])
    : scope === 'all_time'
      ? (data.all_time?.contributors ?? [])
      : (data[board] ?? [])

  const valueFor = (row: LeaderboardPerson): { label: string; value: number } => {
    if (isArchive) {
      if (board === 'contributors') return { label: 'points', value: row.score ?? 0 }
      if (board === 'askers') return { label: 'questions', value: row.questions_count ?? 0 }
      return { label: 'answers', value: row.answers_count ?? 0 }
    }
    if (scope === 'all_time' || board === 'contributors') return { label: 'points', value: row.score ?? row.reputation ?? 0 }
    if (board === 'askers') return { label: 'questions', value: row.questions_count ?? 0 }
    return { label: 'answers', value: row.answers_count ?? 0 }
  }

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1>Leaderboard</h1>
          <span className="muted">
            {isArchive
              ? `Finalized results for ${data.period.period_key}`
              : `Monthly competition — ${data.period.period_key}`}
          </span>
        </div>
        <div className="row">
          {data.archive && data.archive.length > 0 && (
            <select
              className="select"
              style={{ width: 'auto' }}
              value={archiveMonth}
              onChange={(e) => setArchiveMonth(e.target.value)}
              aria-label="Leaderboard month"
            >
              <option value="">Current month</option>
              {data.archive.map((p: { period_key: string }) => (
                <option key={p.period_key} value={p.period_key}>{p.period_key}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {! isArchive && (
        <div className="sort-tabs mb-2">
          {(Object.keys(BOARD_LABELS) as Board[]).map((key) => (
            <Link
              key={key}
              to="#"
              onClick={(e) => { e.preventDefault(); setBoard(key); setScope('month') }}
              className={scope === 'month' && board === key ? 'is-active' : ''}
            >
              {BOARD_LABELS[key]}
            </Link>
          ))}
          <Link
            to="#"
            onClick={(e) => { e.preventDefault(); setScope('all_time') }}
            className={scope === 'all_time' ? 'is-active' : ''}
          >
            All-time
          </Link>
        </div>
      )}

      <div className="panel">
        {rows.length === 0
          ? (
            <EmptyState
              icon="🏆"
              title="Leaderboard results will appear once the community starts contributing."
              action={<Link to="/questions/unanswered" className="btn btn--primary">Answer open questions</Link>}
            />
          )
          : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Member</th>
                  <th style={{ textAlign: 'right' }}>{valueFor(rows[0]).label}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.username}>
                    <td className="rank">#{index + 1}</td>
                    <td>
                      <Link to={`/users/${row.username}`} className="row" style={{ color: 'inherit', gap: '0.6rem' }}>
                        <Avatar name={row.name} path={row.avatar_path} />
                        <span>
                          <b>{row.name}</b>
                          {row.all_time_reputation !== undefined && (
                            <span className="muted" style={{ marginLeft: 8 }}>{formatNumber(row.all_time_reputation)} total rep</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue-700)' }}>
                      {formatNumber(valueFor(row).value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <p className="muted mt-2">
        The monthly leaderboard resets on the 1st of each month — previous months are archived. Rewards, when
        offered, are announced by the FireShark team.
      </p>
    </div>
  )
}
