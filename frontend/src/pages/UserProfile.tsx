import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usersApi } from '../api/endpoints'
import type { Answer, Badge, Question } from '../types'
import { QuestionCard } from '../components/content/QuestionCard'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState, Spinner } from '../components/ui/States'
import { formatDate, formatNumber, verificationLabels } from '../lib/format'
import { User, Award, MessageSquare, Lightbulb, CheckCircle2 } from 'lucide-react'

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
    return <EmptyState icon={<User size={32} strokeWidth={1.5} />} title="This user does not exist." />
  }
  if (loading || ! profile) return <Spinner />

  return (
    <div>
      <div className="panel">
        <div className="panel__body profile-head">
          <Avatar name={profile.name} path={profile.avatar_path} size="lg" />
          <div className="profile-head__info">
            <h1 className="row" style={{ gap: '0.6rem' }}>
              {profile.name}
              {profile.verification && (
                <span className="verified-chip">✓ {verificationLabels[profile.verification] ?? 'Verified'}</span>
              )}
              {(profile.role === 'admin' || profile.role === 'moderator') && (
                <span className="verified-chip" style={{ color: 'var(--fire-500)', background: '#fff1e8' }}>
                  {profile.role === 'admin' ? 'Administrator' : 'Moderator'}
                </span>
              )}
            </h1>
            {profile.expertise && <p className="muted" style={{ margin: '0.1rem 0' }}>{profile.expertise}</p>}
            {profile.bio && <p style={{ margin: '0.5rem 0 0' }}>{profile.bio}</p>}
            <div className="profile-stats">
              <div><b>{formatNumber(profile.reputation)}</b><span>reputation</span></div>
              <div><b>{formatNumber(profile.questions_count)}</b><span>questions</span></div>
              <div><b>{formatNumber(profile.answers_count)}</b><span>answers</span></div>
              <div><b style={{ color: 'var(--green-600)' }}>{formatNumber(profile.accepted_answers_count)}</b><span>accepted</span></div>
              <div><b>{formatNumber(profile.badges?.length ?? 0)}</b><span>badges</span></div>
            </div>
            <span className="muted">Member since {formatDate(profile.member_since ?? profile.created_at)}
              {profile.location ? ` · ${profile.location}` : ''}
              {profile.website && <> · <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website.replace(/^https?:\/\//, '')}</a></>}
            </span>
          </div>
        </div>
      </div>

      {(profile.badges?.length ?? 0) > 0 && (
        <div className="panel mt-2">
          <div className="panel__header"><h2>Badges</h2></div>
          <div className="panel__body">
            {profile.badges.map((badge: Badge) => (
              <div key={badge.id} className="badge-item">
                <span className={`badge-item__icon tier-${badge.tier}`} aria-hidden="true">
                  {badge.tier === 'gold' ? <Award size={16} strokeWidth={2} className="gold" /> : badge.tier === 'silver' ? <Award size={16} strokeWidth={2} className="silver" /> : <Award size={16} strokeWidth={2} className="bronze" />}
                </span>
                <span>
                  <b>{badge.name}</b>
                  <div className="muted">{badge.description}</div>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="sort-tabs" style={{ marginBottom: '0.9rem' }}>
          <button onClick={() => setTab('questions')} style={{ all: 'unset', cursor: 'pointer' }}>
            <span className={tab === 'questions' ? 'is-active' : ''} style={{ padding: '0.32rem 0.7rem', borderRadius: 999, display: 'inline-block' }}>
              Questions ({qMeta.total})
            </span>
          </button>
          <button onClick={() => setTab('answers')} style={{ all: 'unset', cursor: 'pointer' }}>
            <span className={tab === 'answers' ? 'is-active' : ''} style={{ padding: '0.32rem 0.7rem', borderRadius: 999, display: 'inline-block' }}>
              Answers ({aMeta.total})
            </span>
          </button>
        </div>

        {tab === 'questions' && (
          questions.length === 0
            ? <div className="panel"><EmptyState icon={<MessageSquare size={32} strokeWidth={1.5} />} title="No questions asked yet." /></div>
            : (
              <div className="question-list">
                {questions.map((question) => <QuestionCard key={question.id} question={question} />)}
              </div>
            )
        )}

        {tab === 'answers' && (
          answers.length === 0
            ? <div className="panel"><EmptyState icon={<Lightbulb size={32} strokeWidth={1.5} />} title="No answers posted yet." /></div>
            : (
              <div className="panel">
                <div className="panel__body" style={{ padding: 0 }}>
                  {answers.map((answer) => (
                    <div key={answer.id} style={{ padding: '0.8rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
                      <div className="row--between row">
                        <Link to={`/questions/${answer.question?.slug}`} style={{ fontWeight: 600 }}>
                          {answer.question?.title}
                        </Link>
                        {answer.question?.is_solved && <span className="solved-badge"><CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" /></span>}
                      </div>
                      <div className="muted mt-1" style={{ fontSize: '0.85rem' }}>
                        {answer.body.replace(/[#*`>\n]/g, ' ').slice(0, 180)}…
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  )
}