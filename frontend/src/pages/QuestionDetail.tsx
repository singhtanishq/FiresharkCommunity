import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { answersApi, commentsApi, questionsApi } from '../api/endpoints'
import type { Answer, Comment, Question } from '../types'
import { useAuth } from '../context/AuthContext'
import { RichText } from '../components/content/RichText'
import { RichTextEditor } from '../components/content/RichTextEditor'
import { VoteControl } from '../components/content/VoteControl'
import { AuthorLine } from '../components/content/AuthorLine'
import { ReportModal } from '../components/content/ReportModal'
import { ConfirmDialog } from '../components/ui/Modal'
import { EmptyState, Spinner } from '../components/ui/States'
import { apiError } from '../api/client'
import { closedReasonLabels, formatDate, timeAgo, formatNumber } from '../lib/format'
import { 
  Lock, Lightbulb, Search, CheckCircle2, Share2, 
  Bookmark, Flag, Trash2, Edit3, EyeOff, ChevronRight, MessageSquare, AlertTriangle
} from 'lucide-react'

export function QuestionDetail() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [sort, setSort] = useState<'votes' | 'oldest' | 'newest'>('votes')
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [answerBody, setAnswerBody] = useState('')
  const [postingAnswer, setPostingAnswer] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)

  const [reportTarget, setReportTarget] = useState<{ type: 'question' | 'answer' | 'comment'; id: number } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; action: () => Promise<void> } | null>(null)

  const [newComment, setNewComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = await questionsApi.show(slug)
      setQuestion(q)
      setAnswers(await questionsApi.answers(q.id, sort))
      setComments(await commentsApi.list('question', q.id))
      setNotFound(false)
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setNotFound(true)
      } else if (e?.response?.data?.data?.redirect) {
        navigate(e.response.data.data.to, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [slug, sort, navigate])

  useEffect(() => {
    void load()
  }, [load])

  if (notFound) {
    return (
      <div className="panel" style={{ padding: '4rem 2rem', marginTop: '2rem' }}>
        <EmptyState
          icon={<Search size={48} color="var(--brand-blue-300)" strokeWidth={1.5} />}
          title="This intelligence report is classified or missing."
          action={<Link className="btn btn--primary" to="/questions">Return to Feed</Link>}
        />
      </div>
    )
  }

  if (loading || !question) return <div style={{ paddingTop: '4rem' }}><Spinner /></div>

  const isAuthor = user?.id === question.user.id
  const isStaff = user?.role === 'admin' || user?.role === 'moderator'

  const setQuestionVote = (myVote: number, score: number) => {
    setQuestion((prev) => prev ? { ...prev, my_vote: myVote, votes_score: score } : prev)
  }

  const setAnswerVote = (answerId: number, myVote: number, score: number) => {
    setAnswers((prev) => prev.map((a) => (a.id === answerId ? { ...a, my_vote: myVote, votes_score: score } : a)))
  }

  const postAnswer = async () => {
    setPostingAnswer(true)
    setAnswerError(null)
    try {
      const created = await questionsApi.answer(question.id, answerBody)
      setAnswers((prev) => [...prev, { ...created, comments: [] }])
      setAnswerBody('')
      setQuestion((prev) => prev ? { ...prev, answers_count: prev.answers_count + 1 } : prev)
    } catch (e) {
      setAnswerError(apiError(e).message)
    } finally {
      setPostingAnswer(false)
    }
  }

  const acceptAnswer = async (answer: Answer) => {
    try {
      if (answer.accepted) {
        await answersApi.unaccept(answer.id)
      } else {
        await answersApi.accept(answer.id)
      }
      await load()
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  const deleteQuestion = async () => {
    try {
      await questionsApi.destroy(question.id)
      navigate('/questions')
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  const deleteAnswer = async (answer: Answer) => {
    try {
      await answersApi.destroy(answer.id)
      setAnswers((prev) => prev.filter((a) => a.id !== answer.id))
      setQuestion((prev) => prev ? { ...prev, answers_count: Math.max(0, prev.answers_count - 1) } : prev)
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  const postComment = async () => {
    if (!newComment.trim()) return
    setCommentBusy(true)
    try {
      const created = await commentsApi.store('question', question.id, newComment)
      setComments((prev) => [...prev, created])
      setNewComment('')
    } catch (e) {
      alert(apiError(e).message)
    } finally {
      setCommentBusy(false)
    }
  }

  const deleteComment = async (comment: Comment) => {
    try {
      await commentsApi.destroy(comment.id)
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
    } catch (e) {
      alert(apiError(e).message)
    }
  }

  const toggleBookmark = async () => {
    if (!user) return navigate('/login')
    const result = await questionsApi.bookmark(question.id)
    setQuestion((prev) => prev ? { ...prev, bookmarked: result.bookmarked } : prev)
  }

  const toggleFollow = async () => {
    if (!user) return navigate('/login')
    const result = await questionsApi.follow(question.id)
    setQuestion((prev) => prev ? { ...prev, following: result.following } : prev)
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: question.title, url })
        return
      } catch { /* fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb row" style={{ gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }} aria-label="Breadcrumb">
        <Link to="/questions" style={{ color: 'var(--text-3)', fontWeight: 500 }}>Live Feed</Link>
        <ChevronRight size={14} color="var(--border-strong)" style={{ flexShrink: 0 }} />
        <Link to={`/categories/${question.category.slug}`} style={{ color: 'var(--ink-900)', fontWeight: 600, wordBreak: 'break-word' }}>{question.category.name}</Link>
      </nav>

      {/* Header */}
      <div className="row row--between mb-3" style={{ alignItems: 'flex-start', gap: '1.5rem', animation: 'modal-rise var(--dur) var(--ease) 0.05s both', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: 'var(--ink-900)', lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0, flex: '1 1 260px', minWidth: 0, wordBreak: 'break-word' }}>
          {question.title}
        </h1>
        {(isAuthor || isStaff) && (
          <Link to={`/ask?edit=${question.id}`} className="btn btn--ghost" state={{ question }} style={{ flexShrink: 0 }}>
            <Edit3 size={16} style={{ flexShrink: 0 }} /> Edit
          </Link>
        )}
      </div>

      {/* Banners */}
      {question.status === 'closed' && (
        <div className="banner banner--warn mb-3" style={{ borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
          <Lock size={18} strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>This thread is locked {question.closed_reason ? `(${closedReasonLabels[question.closed_reason] ?? question.closed_reason})` : ''}. No further answers can be submitted.</span>
        </div>
      )}
      {question.status === 'hidden' && (
        <div className="banner banner--danger mb-3" style={{ borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
          <EyeOff size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>This thread is currently hidden by community moderators.</span>
        </div>
      )}

      {/* Primary Question Post */}
      <article className="panel post mb-2" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', animation: 'modal-rise var(--dur) var(--ease) 0.1s both', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <VoteControl
          votableType="question"
          votableId={question.id}
          authorId={question.user.id}
          score={question.votes_score}
          myVote={question.my_vote ?? 0}
          onVoted={setQuestionVote}
        />

        <div className="post__body" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div className="rich-text" style={{ fontSize: '1.05rem', color: 'var(--ink-800)', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <RichText markdown={question.body ?? ''} />
          </div>

          <div className="row mt-3" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
            {question.tags.map((tag) => (
              <Link key={tag.id} className="chip" to={`/tags/${tag.slug}`} style={{ flexShrink: 0 }}>{tag.name}</Link>
            ))}
          </div>

          <div className="post__meta mt-3" style={{ flexWrap: 'wrap', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
            <AuthorLine user={question.user} prefix="asked" date={formatDate(question.created_at)} />
            <span className="muted" style={{ paddingLeft: '0', sm: { paddingLeft: '1rem' }, borderLeft: 'none', sm: { borderLeft: '1px solid var(--border)' }, flexShrink: 0 }}>
              {formatNumber(question.views)} views
            </span>
            
            <div className="post__actions" style={{ flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button className="btn btn--quiet btn--sm" onClick={share} style={{ flexShrink: 0 }}>
                <Share2 size={14} style={{ flexShrink: 0 }} /> {copied ? 'Copied!' : 'Share'}
              </button>
              {user && (
                <>
                  <button className="btn btn--quiet btn--sm" onClick={toggleBookmark} style={{ color: question.bookmarked ? 'var(--brand-blue-600)' : undefined, flexShrink: 0 }}>
                    <Bookmark size={14} fill={question.bookmarked ? 'currentColor' : 'none'} style={{ flexShrink: 0 }} /> {question.bookmarked ? 'Saved' : 'Save'}
                  </button>
                  <button className="btn btn--quiet btn--sm" onClick={toggleFollow} style={{ flexShrink: 0 }}>
                    {question.following ? '✓ Following' : 'Follow'}
                  </button>
                </>
              )}
              {user && !isAuthor && (
                <button className="btn btn--quiet btn--sm" onClick={() => setReportTarget({ type: 'question', id: question.id })} style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                  <Flag size={14} style={{ flexShrink: 0 }} /> Report
                </button>
              )}
              {isAuthor && question.answers_count === 0 && (
                <button className="btn btn--quiet btn--sm" style={{ color: 'var(--danger)', flexShrink: 0 }} onClick={() => setConfirm({ message: 'Delete this question? This cannot be undone.', action: deleteQuestion })}>
                  <Trash2 size={14} style={{ flexShrink: 0 }} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Question Comments */}
      <section className="comment-thread" style={{ animation: 'fade-in var(--dur-slow) var(--ease) 0.15s both', width: '100%', boxSizing: 'border-box' }}>
        {comments.map((comment) => (
          <div key={comment.id} className="comment-row" style={{ padding: '0.6rem 0.5rem', transition: 'background var(--dur) var(--ease)', flexWrap: 'wrap', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '0.9rem', color: 'var(--ink-800)', lineHeight: 1.5, flex: '1 1 200px', minWidth: 0, wordBreak: 'break-word' }}>
              {comment.body} <span className="muted" style={{ margin: '0 0.4rem' }}>—</span> 
              <AuthorLine user={comment.user} date={timeAgo(comment.created_at)} />
            </span>
            {(user?.id === comment.user.id || isStaff) && (
              <button className="btn btn--quiet btn--sm" style={{ padding: '0.2rem', color: 'var(--danger)', opacity: 0.6, flexShrink: 0 }} onClick={() => deleteComment(comment)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        
        {user && (
          <div className="comment-composer row" style={{ marginTop: '0.8rem', flexWrap: 'wrap', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
            <input
              className="input input--sm"
              style={{ flex: '1 1 200px', background: 'var(--surface-2)', border: '1px solid transparent', minWidth: '160px', boxSizing: 'border-box' }}
              placeholder="Suggest an improvement or ask for clarification..."
              value={newComment}
              maxLength={2000}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void postComment() }}
            />
            <button className="btn btn--ghost btn--sm" onClick={postComment} disabled={commentBusy || !newComment.trim()} style={{ flexShrink: 0 }}>
              Comment
            </button>
          </div>
        )}
      </section>

      {/* Answers Section */}
      <section className="mt-4" style={{ paddingTop: '2rem', borderTop: '2px solid var(--border)', animation: 'fade-in var(--dur-slow) var(--ease) 0.2s both', width: '100%', boxSizing: 'border-box' }}>
        <div className="row row--between mb-3" style={{ flexWrap: 'wrap', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>{formatNumber(question.answers_count)} {question.answers_count === 1 ? 'Answer' : 'Answers'}</span>
            {question.is_solved && <span className="chip" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #bbf7d0', padding: '0.2rem 0.6rem', flexShrink: 0 }}><CheckCircle2 size={14} style={{ flexShrink: 0 }} /> Solved</span>}
          </h2>
          
          {answers.length > 1 && (
            <div style={{ background: 'var(--surface-2)', padding: '0.3rem', borderRadius: 'var(--radius)', display: 'inline-flex', gap: '0.2rem', border: '1px solid var(--border)', overflowX: 'auto', maxWidth: '100%', boxSizing: 'border-box' }}>
              {(['votes', 'oldest', 'newest'] as const).map((s) => (
                <button 
                  key={s} 
                  onClick={() => setSort(s)} 
                  style={{
                    padding: '0.35rem 0.9rem', fontSize: '0.85rem', fontWeight: 600,
                    borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer',
                    color: sort === s ? 'var(--brand-blue-700)' : 'var(--text-2)',
                    background: sort === s ? '#fff' : 'transparent',
                    boxShadow: sort === s ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--dur-fast) var(--ease)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {s === 'votes' ? 'Highest Score' : s === 'oldest' ? 'Oldest' : 'Newest'}
                </button>
              ))}
            </div>
          )}
        </div>

        {answers.length === 0 && (
          <div className="panel" style={{ padding: '4rem 2rem' }}>
            <EmptyState
              icon={<Lightbulb size={40} color="var(--brand-blue-400)" strokeWidth={1.5} />}
              title="Awaiting intel. Be the first to provide a solution."
            />
          </div>
        )}

        {answers.map((answer) => (
          <article key={answer.id} className={`panel post mb-3 ${answer.accepted ? 'post--accepted' : ''}`} id={`answer-${answer.id}`} style={{ border: answer.accepted ? '2px solid var(--success)' : '1px solid var(--border)', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <VoteControl
              votableType="answer"
              votableId={answer.id}
              authorId={answer.user.id}
              score={answer.votes_score}
              myVote={answer.my_vote ?? 0}
              onVoted={(myVote, score) => setAnswerVote(answer.id, myVote, score)}
            />

            <div className="post__body" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
              {answer.accepted && (
                <div className="row mb-2" style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', background: 'var(--success-bg)', display: 'inline-flex', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
                  <CheckCircle2 size={16} strokeWidth={2.5} style={{ marginRight: '0.4rem', flexShrink: 0 }} />
                  <span>Accepted Solution</span>
                  {isAuthor && (
                    <button className="link-btn" style={{ marginLeft: '0.5rem', color: 'var(--text-3)', fontWeight: 500, fontSize: '0.8rem' }} onClick={() => acceptAnswer(answer)}>
                      (Undo)
                    </button>
                  )}
                </div>
              )}

              <div className="rich-text" style={{ fontSize: '1rem', color: 'var(--ink-800)', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
                <RichText markdown={answer.body} />
              </div>

              <div className="post__meta mt-3" style={{ flexWrap: 'wrap', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                <AuthorLine user={answer.user} prefix="answered" date={formatDate(answer.created_at)} />
                <span className="post__actions" style={{ flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  {!answer.accepted && isAuthor && question.answers_count > 0 && (
                    <button className="btn btn--quiet btn--sm" style={{ color: 'var(--success)', flexShrink: 0 }} onClick={() => acceptAnswer(answer)}>
                      <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> Accept Solution
                    </button>
                  )}
                  {user && !isAuthor && (
                    <button className="btn btn--quiet btn--sm" onClick={() => setReportTarget({ type: 'answer', id: answer.id })} style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                      <Flag size={14} style={{ flexShrink: 0 }} /> Report
                    </button>
                  )}
                  {(user?.id === answer.user.id && !answer.accepted) && (
                    <button className="btn btn--quiet btn--sm" style={{ color: 'var(--danger)', flexShrink: 0 }} onClick={() => setConfirm({ message: 'Delete this answer?', action: () => deleteAnswer(answer) })}>
                      <Trash2 size={14} style={{ flexShrink: 0 }} /> Delete
                    </button>
                  )}
                </span>
              </div>

              {answer.comments && answer.comments.length > 0 && (
                <div className="comment-thread" style={{ margin: '1rem 0 0 0', padding: '1rem 0 0 0', width: '100%', boxSizing: 'border-box' }}>
                  {answer.comments.map((comment) => (
                    <div key={comment.id} className="comment-row" style={{ padding: '0.4rem 0.5rem', transition: 'background var(--dur) var(--ease)', flexWrap: 'wrap', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--ink-800)', flex: '1 1 200px', minWidth: 0, wordBreak: 'break-word' }}>
                        {comment.body} <span className="muted" style={{ margin: '0 0.4rem' }}>—</span> 
                        <AuthorLine user={comment.user} date={timeAgo(comment.created_at)} />
                      </span>
                      {(user?.id === comment.user.id || isStaff) && (
                        <button className="btn btn--quiet btn--sm" style={{ padding: '0.2rem', color: 'var(--danger)', opacity: 0.6, flexShrink: 0 }} onClick={async () => { await commentsApi.destroy(comment.id); await load() }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <AnswerCommentBox answerId={answer.id} onAdded={() => load()} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Answer Form */}
      {question.status === 'closed' ? null : user ? (
        <section className="panel mt-4" style={{ borderTop: '4px solid var(--brand-blue-600)', animation: 'fade-in var(--dur-slow) var(--ease) 0.3s both', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <div className="panel__header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Your Answer</h2>
          </div>
          <div className="panel__body" style={{ width: '100%', boxSizing: 'border-box' }}>
            {answerError && (
              <div className="banner banner--danger mb-2" style={{ boxSizing: 'border-box' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>{answerError}</span>
              </div>
            )}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <RichTextEditor value={answerBody} onChange={setAnswerBody} placeholder="Draft your solution here. Use code blocks for logs, commands, and scripts..." minHeight={220} />
            </div>
            <div className="row mt-3" style={{ justifyContent: 'flex-end', width: '100%', boxSizing: 'border-box' }}>
              <button className="btn btn--fire btn--lg" onClick={postAnswer} disabled={postingAnswer || answerBody.trim().length < 30} style={{ width: '100%', sm: { width: 'auto' }, flexWrap: 'wrap', justifyContent: 'center' }}>
                {postingAnswer ? 'Transmitting…' : <><MessageSquare size={16} style={{ flexShrink: 0 }} /> <span>Submit Answer</span></>}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="panel mt-4" style={{ background: 'var(--surface-2)', borderStyle: 'dashed', width: '100%', boxSizing: 'border-box' }}>
          <div className="panel__body row row--between" style={{ padding: '2rem', flexWrap: 'wrap', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--ink-800)', wordBreak: 'break-word', flex: '1 1 240px' }}>Have a potential solution? Log in to assist the community.</span>
            <Link to="/login" className="btn btn--primary btn--lg" style={{ flexShrink: 0 }}>Authenticate</Link>
          </div>
        </div>
      )}

      {/* Modals */}
      {reportTarget && (
        <ReportModal reportableType={reportTarget.type} reportableId={reportTarget.id} onClose={() => setReportTarget(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={confirm.message}
          confirmLabel="Delete Permanently"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { const action = confirm.action; setConfirm(null); await action() }}
        />
      )}
    </div>
  )
}

function AnswerCommentBox({ answerId, onAdded }: { answerId: number; onAdded: () => void }) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const submit = async () => {
    if (!body.trim()) return
    setBusy(true)
    try {
      await commentsApi.store('answer', answerId, body)
      setBody('')
      onAdded()
    } catch (e) {
      alert(apiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="comment-composer row" style={{ marginTop: '0.8rem', flexWrap: 'wrap', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
      <input
        className="input input--sm"
        style={{ flex: '1 1 200px', background: 'var(--surface-2)', border: '1px solid transparent', minWidth: '160px', boxSizing: 'border-box' }}
        placeholder="Request clarification on this answer..."
        value={body}
        maxLength={2000}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
      />
      <button className="btn btn--ghost btn--sm" onClick={submit} disabled={busy || !body.trim()} style={{ flexShrink: 0 }}>
        Comment
      </button>
    </div>
  )
}