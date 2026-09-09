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
import { closedReasonLabels, formatDate, timeAgo } from '../lib/format'
import { Lock, Lightbulb, MessageSquare, Eye, ChevronDown, AlertTriangle, Search, UserPlus, UserMinus, Flag, Bookmark, BookOpen, Mail, AlertCircle, CheckCircle2, XCircle, Share2, ChevronRight, Copy } from 'lucide-react'

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
      <div className="panel">
        <EmptyState
          icon={<Search size={32} strokeWidth={1.5} />}
          title="This question does not exist or is no longer available."
          action={<Link className="btn btn--primary" to="/questions">Browse questions</Link>}
        />
      </div>
    )
  }

  if (loading || ! question) return <Spinner />

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
    if (! newComment.trim()) return
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
    if (! user) return navigate('/login')
    const result = await questionsApi.bookmark(question.id)
    setQuestion((prev) => prev ? { ...prev, bookmarked: result.bookmarked } : prev)
  }

  const toggleFollow = async () => {
    if (! user) return navigate('/login')
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
    <div>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/questions">Questions</Link> › <Link to={`/categories/${question.category.slug}`}>{question.category.name}</Link>
      </nav>

      <div className="row--between row">
        <h1 className="question-detail__title">{question.title}</h1>
        {(isAuthor || isStaff) && (
          <Link
            to={`/ask?edit=${question.id}`}
            className="btn btn--ghost btn--sm"
            state={{ question }}
          >
            Edit
          </Link>
        )}
      </div>

      {question.status === 'closed' && (
        <div className="banner banner--info">
          <Lock size={18} strokeWidth={2} style={{ marginRight: 8 }} aria-hidden="true" />
          This question is closed{question.closed_reason ? ` (${closedReasonLabels[question.closed_reason] ?? question.closed_reason})` : ''}. New answers cannot be added.
        </div>
      )}
      {question.status === 'hidden' && (
        <div className="banner banner--info">This question is currently hidden by moderators.</div>
      )}

      <article className={`panel post ${question.accepted_answer_id ? '' : ''}`}>
        <VoteControl
          votableType="question"
          votableId={question.id}
          authorId={question.user.id}
          score={question.votes_score}
          myVote={question.my_vote ?? 0}
          onVoted={setQuestionVote}
        />

        <div className="post__body">
          <RichText markdown={question.body ?? ''} />

          <div className="row mt-2">
            {question.tags.map((tag) => (
              <Link key={tag.id} className="tag-chip" to={`/tags/${tag.slug}`}>{tag.name}</Link>
            ))}
          </div>

          <div className="post__meta">
            <AuthorLine user={question.user} prefix="asked" date={formatDate(question.created_at)} />
            <span className="muted">👁 {question.views} views</span>
            <span className="post__actions">
              <button className="link-btn" onClick={share}>{copied ? 'Link copied!' : 'Share'}</button>
              {user && (
                <>
                  <button className="link-btn" onClick={toggleBookmark}>
                    {question.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                  </button>
                  <button className="link-btn" onClick={toggleFollow}>
                    {question.following ? '✓ Following' : '＋ Follow'}
                  </button>
                </>
              )}
              {user && ! isAuthor && (
                <button className="link-btn" onClick={() => setReportTarget({ type: 'question', id: question.id })}>Report</button>
              )}
              {isAuthor && question.answers_count === 0 && (
                <button className="link-btn" onClick={() => setConfirm({ message: 'Delete this question? This cannot be undone.', action: deleteQuestion })}>
                  Delete
                </button>
              )}
            </span>
          </div>
        </div>
      </article>

      {/* Comments on the question */}
      <section className="mt-1" style={{ marginLeft: 56 }}>
        {comments.map((comment) => (
          <div key={comment.id} className="row--between row" style={{ padding: '0.35rem 0', borderBottom: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '0.88rem' }}>
              <AuthorLine user={comment.user} date={timeAgo(comment.created_at)} />{' '}
              — {comment.body}
            </span>
            {(user?.id === comment.user.id || isStaff) && (
              <button className="link-btn" onClick={() => deleteComment(comment)}>delete</button>
            )}
          </div>
        ))}
        {user && (
          <div className="row mt-1">
            <input
              className="input"
              style={{ maxWidth: 480 }}
              placeholder="Add a comment…"
              value={newComment}
              maxLength={2000}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void postComment() }}
            />
            <button className="btn btn--ghost btn--sm" onClick={postComment} disabled={commentBusy || ! newComment.trim()}>Comment</button>
          </div>
        )}
      </section>

      {/* Answers */}
      <section className="mt-3">
        <div className="row--between row mb-2">
          <h2>
            {question.answers_count} {question.answers_count === 1 ? 'Answer' : 'Answers'}
            {question.is_solved && <span className="solved-badge" style={{ marginLeft: 10 }}>✓ Solved</span>}
          </h2>
          {answers.length > 1 && (
            <div className="sort-tabs">
              {(['votes', 'oldest', 'newest'] as const).map((s) => (
                <Link key={s} to="#" onClick={(e) => { e.preventDefault(); setSort(s) }} className={sort === s ? 'is-active' : ''}>
                  {s === 'votes' ? 'Highest voted' : s === 'oldest' ? 'Oldest' : 'Newest'}
                </Link>
              ))}
            </div>
          )}
        </div>

        {answers.length === 0 && (
          <div className="panel">
            <EmptyState
              icon={<Lightbulb size={32} strokeWidth={1.5} />}
              title="No answers yet. Know the answer? Share your knowledge."
            />
          </div>
        )}

        {answers.map((answer) => (
          <article key={answer.id} className={`panel post mt-1 ${answer.accepted ? 'post--accepted' : ''}`} id={`answer-${answer.id}`}>
            <VoteControl
              votableType="answer"
              votableId={answer.id}
              authorId={answer.user.id}
              score={answer.votes_score}
              myVote={answer.my_vote ?? 0}
              onVoted={(myVote, score) => setAnswerVote(answer.id, myVote, score)}
            />

            <div className="post__body">
              {answer.accepted && (
                <div className="accepted-flag mb-2" title="Accepted answer">
                  <CheckCircle2 size={16} strokeWidth={2} style={{ marginRight: 4 }} aria-hidden="true" />
                  Accepted Answer
                  {isAuthor && (
                    <button className="link-btn" style={{ color: 'var(--muted)', fontWeight: 400 }} onClick={() => acceptAnswer(answer)}>
                      (unaccept)
                    </button>
                  )}
                </div>
              )}

              <RichText markdown={answer.body} />

              <div className="post__meta">
                <AuthorLine user={answer.user} prefix="answered" date={formatDate(answer.created_at)} />
                <span className="post__actions">
                  {! answer.accepted && isAuthor && question.answers_count > 0 && (
                    <button className="link-btn" onClick={() => acceptAnswer(answer)}>✓ Accept</button>
                  )}
                  {user && ! isAuthor && (
                    <button className="link-btn" onClick={() => setReportTarget({ type: 'answer', id: answer.id })}>Report</button>
                  )}
                  {(user?.id === answer.user.id && ! answer.accepted) && (
                    <button className="link-btn" onClick={() => setConfirm({ message: 'Delete this answer?', action: () => deleteAnswer(answer) })}>Delete</button>
                  )}
                </span>
              </div>

              {answer.comments && answer.comments.length > 0 && (
                <div className="mt-1" style={{ borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                  {answer.comments.map((comment) => (
                    <div key={comment.id} className="row--between row" style={{ padding: '0.3rem 0' }}>
                      <span style={{ fontSize: '0.86rem' }}>
                        <AuthorLine user={comment.user} date={timeAgo(comment.created_at)} /> — {comment.body}
                      </span>
                      {(user?.id === comment.user.id || isStaff) && (
                        <button className="link-btn" onClick={async () => {
                          await commentsApi.destroy(comment.id)
                          await load()
                        }}>delete</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <AnswerCommentBox answerId={answer.id} onAdded={() => load()} />
            </div>
          </article>
        ))}
      </section>

      {/* Answer form */}
      {question.status === 'closed'
        ? null
        : user
          ? (
            <section className="panel mt-3">
              <div className="panel__header"><h2>Your Answer</h2></div>
              <div className="panel__body">
                {answerError && <div className="form-error">{answerError}</div>}
                <RichTextEditor value={answerBody} onChange={setAnswerBody} placeholder="Share your knowledge — include commands, configuration and expected results." minHeight={180} />
                <div className="row mt-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn--fire" onClick={postAnswer} disabled={postingAnswer || answerBody.trim().length < 30}>
                    {postingAnswer ? 'Posting…' : 'Post Your Answer'}
                  </button>
                </div>
              </div>
            </section>
          )
          : (
            <div className="panel mt-3">
              <div className="panel__body row" style={{ justifyContent: 'space-between' }}>
                <span>Know the answer? Log in to help the community.</span>
                <Link to="/login" className="btn btn--primary btn--sm">Log in</Link>
              </div>
            </div>
          )}

      {reportTarget && (
        <ReportModal reportableType={reportTarget.type} reportableId={reportTarget.id} onClose={() => setReportTarget(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          title="Are you sure?"
          message={confirm.message}
          confirmLabel="Delete"
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

  if (! user) return null

  const submit = async () => {
    if (! body.trim()) return
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
    <div className="row mt-1">
      <input
        className="input"
        style={{ maxWidth: 420, fontSize: '0.88rem' }}
        placeholder="Add a comment…"
        value={body}
        maxLength={2000}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
      />
      <button className="btn btn--ghost btn--sm" onClick={submit} disabled={busy || ! body.trim()}>Comment</button>
    </div>
  )
}