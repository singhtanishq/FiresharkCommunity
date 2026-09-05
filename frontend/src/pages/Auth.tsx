import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 420, margin: '2.5rem auto' }}>
      <div className="panel">
        <div className="panel__body">
          <h1 style={{ fontSize: '1.4rem' }}>{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setErrors({})
    try {
      await login(email, password)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from)
    } catch (err) {
      const apiErr = apiError(err)
      setError(apiErr.message)
      setErrors(apiErr.errors ?? {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back">
      {error && <div className="form-error">{error}{errors.email && <div>{errors.email[0]}</div>}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-email">Email or username</label>
          <input id="login-email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted mt-2">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="muted">
        New to the community? <Link to="/register">Create an account</Link>
      </p>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setErrors({})
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const apiErr = apiError(err)
      setError(apiErr.message)
      setErrors(apiErr.errors ?? {})
      setBusy(false)
    }
  }

  const fieldError = (name: string) => errors[name]?.[0]

  return (
    <AuthShell title="Join the FireShark Community">
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="reg-name">Full name</label>
          <input id="reg-name" className="input" value={form.name} onChange={update('name')} required />
          {fieldError('name') && <p className="hint" style={{ color: 'var(--red-600)' }}>{fieldError('name')}</p>}
        </div>
        <div className="field">
          <label htmlFor="reg-username">Username</label>
          <input id="reg-username" className="input" value={form.username} onChange={update('username')} required />
          {fieldError('username') && <p className="hint" style={{ color: 'var(--red-600)' }}>{fieldError('username')}</p>}
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" type="email" className="input" value={form.email} onChange={update('email')} required />
          {fieldError('email') && <p className="hint" style={{ color: 'var(--red-600)' }}>{fieldError('email')}</p>}
        </div>
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" className="input" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
          <p className="hint">At least 8 characters.</p>
        </div>
        <button className="btn btn--fire btn--lg" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="muted mt-2">
        Already a member? <Link to="/login">Log in</Link>
      </p>
      <p className="muted" style={{ fontSize: '0.8rem' }}>
        By registering you agree to the <Link to="/community-guidelines">community guidelines</Link>.
      </p>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await authApi.forgotPassword(email)
    } finally {
      setSent(true)
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Reset your password">
      {sent
        ? <p>If an account exists for that address, a password reset link has been sent. Check your inbox.</p>
        : (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="forgot-email">Email address</label>
              <input id="forgot-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn--primary" style={{ width: '100%' }} disabled={busy}>Send reset link</button>
          </form>
        )}
      <p className="muted mt-2"><Link to="/login">Back to login</Link></p>
    </AuthShell>
  )
}

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authApi.resetPassword({ token, email, password, password_confirmation: confirmation })
      navigate('/login')
    } catch (err) {
      setError(apiError(err).message)
      setBusy(false)
    }
  }

  if (! token || ! email) {
    return (
      <AuthShell title="Invalid reset link">
        <p>This password reset link is invalid or incomplete.</p>
        <Link to="/forgot-password" className="btn btn--primary">Request a new link</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password">
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="reset-password">New password</label>
          <input id="reset-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="reset-confirm">Confirm password</label>
          <input id="reset-confirm" type="password" className="input" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required autoComplete="new-password" />
        </div>
        <button className="btn btn--primary" style={{ width: '100%' }} disabled={busy}>Reset password</button>
      </form>
    </AuthShell>
  )
}

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'success' | 'error'>('working')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const id = searchParams.get('id')
    const hash = searchParams.get('hash')
    const expires = searchParams.get('expires')
    const signature = searchParams.get('signature')

    if (! id || ! hash || ! expires || ! signature) {
      setStatus('error')
      setMessage('This verification link is incomplete.')
      return
    }

    fetch(`/api/v1/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}))
        if (res.ok && payload.success) {
          setStatus('success')
          setMessage(payload.message ?? 'Your email address has been verified.')
          await refresh()
          setTimeout(() => navigate('/'), 2500)
        } else {
          setStatus('error')
          setMessage(payload.message ?? 'We could not verify your email address.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Try the link again.')
      })
  }, [searchParams, refresh, navigate])

  const resend = async () => {
    try {
      await authApi.sendVerification()
      setMessage('Verification link sent. Check your inbox.')
    } catch (e) {
      setMessage(apiError(e).message)
    }
  }

  return (
    <AuthShell title="Email verification">
      {status === 'working' && <p>Verifying your email address…</p>}
      {status === 'success' && (
        <>
          <div className="form-success">✓ {message}</div>
          <p className="muted">Redirecting you home…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="form-error">{message}</div>
          {user && ! user.email_verified && (
            <button className="btn btn--primary" onClick={resend}>Resend verification email</button>
          )}
          {! user && <Link to="/login" className="btn btn--primary">Log in</Link>}
        </>
      )}
    </AuthShell>
  )
}
