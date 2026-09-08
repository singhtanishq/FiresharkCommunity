import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoWhite from '../assets/fireshark_community.png'
import { authApi } from '../api/endpoints'
import { apiError } from '../api/client'

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__art">
        <div className="auth-shell__art-inner">
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <img src={logoWhite} alt="FireShark" style={{ height: 34 }} />
          </Link>
          <h2>Where cybersecurity professionals ask, answer, and learn.</h2>
          <p>The FireShark Community is a public knowledge base run on peer-reviewed answers.</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem' }}>
            <li>✓ Practical, hands-on cybersecurity questions</li>
            <li>✓ Monthly leaderboard &amp; badges</li>
            <li>✓ Verified instructors and professionals</li>
            <li>✓ Searchable knowledge that grows with the community</li>
          </ul>
        </div>
      </div>
      <div className="auth-shell__form">
        <div className="auth-shell__card">
          <h1 style={{ fontSize: '1.65rem' }}>{title}</h1>
          {subtitle && <p className="muted" style={{ marginTop: -4, marginBottom: '1.5rem' }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

function StepDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="step-list">
      {steps.map((s, i) => (
        <li key={s} className={i === current ? 'is-active' : i < current ? 'is-done' : ''}>
          <b>{i + 1}</b>
          {s}
        </li>
      ))}
    </ol>
  )
}

function OtpInput({ value, onChange, disabled, autoFocus }: { value: string; onChange: (v: string) => void; disabled?: boolean; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const handle = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1)
    const next = (value.padEnd(6, ' ').split('') as string[]).map((c, idx) => (idx === i ? digit : c))
    const out = next.join('').replace(/\s/g, '').slice(0, 6)
    onChange(out)
    if (digit && i < 5) refs.current[i + 1]?.focus()
  }
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
  }
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }
  return (
    <div className="otp-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1} of 6`}
          className="input"
        />
      ))}
    </div>
  )
}

// =====================================================================
// LOGIN — two-stage: password then OTP
// =====================================================================

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [step, setStep] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [resendAfter, setResendAfter] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (! resendAfter) return
    const tick = () => setCooldown(Math.max(0, Math.ceil((resendAfter.getTime() - Date.now()) / 1000)))
    tick()
    const i = setInterval(tick, 500)
    return () => clearInterval(i)
  }, [resendAfter])

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const start = await authApi.startLogin({ email, password })
      setEmail(start.identifier)
      setOtpToken(start.token)
      setExpiresAt(new Date(start.expires_at))
      setResendAfter(new Date(start.resend_after ?? new Date(Date.now() + 30_000).toISOString()))
      setStep('otp')
    } catch (err) {
      setError(apiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      await authApi.verifyLoginOtp({ identifier: email, code: otp }, otpToken)
      navigate(from)
    } catch (err) {
      setError(apiError(err).message)
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setBusy(true)
    try {
      const r = await authApi.resendLoginOtp(email)
      setOtpToken(r.token)
      setExpiresAt(new Date(r.expires_at))
      setResendAfter(new Date(Date.now() + 30_000))
    } catch (err) { setError(apiError(err).message) }
    finally { setBusy(false) }
  }

  const ttl = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)) : 0

  return (
    <AuthShell title="Welcome back" subtitle={step === 'otp' ? `Enter the 6-digit code sent to ${email}.` : 'Sign in to your account.'}>
      <StepDots steps={['Email & password', 'Verify code', 'Done']} current={step === 'password' ? 0 : 1} />

      {error && <div className="form-error">{error}</div>}

      {step === 'password' && (
        <form onSubmit={submitPassword}>
          <div className="field">
            <label htmlFor="login-email">Email or username</label>
            <input id="login-email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" autoFocus />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp}>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <p className="help-inline">Code expires in {Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</p>
          </div>
          <button className="btn btn--primary btn--block btn--lg" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <div className="otp-resend">
            Didn't receive a code?
            <button type="button" onClick={resend} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <button type="button" className="btn btn--quiet btn--sm mt-1" onClick={() => { setStep('password'); setOtp(''); setError(null) }}>
            ← Back to password
          </button>
        </form>
      )}

      <div className="mt-2 muted text-3" style={{ textAlign: 'center' }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
      <p className="muted text-3" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        New to the community? <Link to="/register">Create an account</Link>
      </p>
    </AuthShell>
  )
}

// =====================================================================
// REGISTER — three stages: details → email OTP → password
// =====================================================================

export function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'details' | 'otp' | 'password'>('details')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [resendAfter, setResendAfter] = useState<Date | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'reserved'>('idle')
  const [usernameHint, setUsernameHint] = useState<string | null>(null)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    if (step !== 'details') return
    const u = form.username.trim()
    if (u.length < 3) { setUsernameStatus('idle'); setUsernameHint(null); return }
    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      try {
        const r = await authApi.checkUsername(u)
        setUsernameStatus(r.available ? 'ok' : 'taken')
        setUsernameHint(r.available
          ? 'Username is available.'
          : r.reason === 'reserved' ? 'That username is reserved.'
          : 'That username is already taken.')
      } catch { setUsernameStatus('idle') }
    }, 400)
    return () => clearTimeout(t)
  }, [form.username, step])

  useEffect(() => {
    if (! resendAfter) return
    const tick = () => setCooldown(Math.max(0, Math.ceil((resendAfter.getTime() - Date.now()) / 1000)))
    tick()
    const i = setInterval(tick, 500)
    return () => clearInterval(i)
  }, [resendAfter])

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await authApi.startRegistration(form)
      setOtpToken(r.token)
      setExpiresAt(new Date(r.expires_at))
      setResendAfter(new Date(Date.now() + 30_000))
      setStep('otp')
    } catch (err) {
      setError(apiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      await authApi.verifySignupOtp({ identifier: form.email, code: otp }, otpToken)
      setStep('password')
    } catch (err) {
      setError(apiError(err).message)
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    setError(null)
    try {
      await authApi.completeRegistration(form.email)
      navigate('/')
    } catch (err) {
      setError(apiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setBusy(true)
    try {
      const r = await authApi.resendSignupOtp(form.email)
      setOtpToken(r.token)
      setExpiresAt(new Date(r.expires_at))
      setResendAfter(new Date(Date.now() + 30_000))
    } catch (err) { setError(apiError(err).message) }
    finally { setBusy(false) }
  }

  const ttl = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)) : 0

  return (
    <AuthShell
      title="Join the FireShark Community"
      subtitle={
        step === 'details' ? 'Create an account. Start with the basics.'
        : step === 'otp' ? `A 6-digit code has been sent to ${form.email}.`
        : 'Set a password to finish creating your account.'
      }
    >
      <StepDots steps={['Name & email', 'Verify email', 'Set password']} current={step === 'details' ? 0 : step === 'otp' ? 1 : 2} />

      {error && <div className="form-error">{error}</div>}

      {step === 'details' && (
        <form onSubmit={submitDetails}>
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input id="reg-name" className="input" value={form.name} onChange={update('name')} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="reg-username">Username</label>
            <input id="reg-username" className={`input ${usernameStatus === 'taken' ? 'input--error' : ''}`} value={form.username} onChange={update('username')} required minLength={3} maxLength={30} />
            {usernameStatus !== 'idle' && usernameHint && (
              <p className={`help-inline ${usernameStatus === 'ok' ? 'is-ok' : 'is-bad'}`}>
                {usernameStatus === 'checking' ? 'Checking availability…' : (usernameStatus === 'ok' ? '✓ ' : '✕ ') + usernameHint}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="input" value={form.email} onChange={update('email')} required />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="input" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
            <p className="hint">At least 8 characters. Use a unique password.</p>
          </div>
          <button
            type="submit"
            className="btn btn--fire btn--block btn--lg"
            disabled={busy || !form.name || !form.username || !form.email || form.password.length < 8}
          >
            {busy ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp}>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <p className="help-inline">Code expires in {Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</p>
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Verify email'}
          </button>
          <div className="otp-resend">
            Didn't receive a code?
            <button type="button" onClick={resend} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <button type="button" className="btn btn--quiet btn--sm mt-1" onClick={() => setStep('details')}>
            ← Back
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword}>
          <div className="form-success">Email verified. Now choose a password to activate your account.</div>
          <div className="field">
            <label htmlFor="reg-pw-1">Password</label>
            <input id="reg-pw-1" type="password" className="input" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="reg-pw-2">Confirm password</label>
            <input id="reg-pw-2" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            {confirm && confirm !== form.password && <p className="help-inline is-bad">Passwords do not match.</p>}
          </div>
          <button type="submit" className="btn btn--fire btn--block btn--lg" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      <p className="muted text-3 mt-2" style={{ textAlign: 'center' }}>
        Already a member? <Link to="/login">Log in</Link>
      </p>
      <p className="muted text-3" style={{ fontSize: '0.78rem', textAlign: 'center', marginTop: '0.6rem' }}>
        By registering you agree to the <Link to="/community-guidelines">community guidelines</Link>.
      </p>
    </AuthShell>
  )
}

// =====================================================================
// FORGOT PASSWORD — three stages: email → OTP → new password
// =====================================================================

export function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [resendAfter, setResendAfter] = useState<Date | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (! resendAfter) return
    const tick = () => setCooldown(Math.max(0, Math.ceil((resendAfter.getTime() - Date.now()) / 1000)))
    tick()
    const i = setInterval(tick, 500)
    return () => clearInterval(i)
  }, [resendAfter])

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await authApi.forgotPassword(email)
      setOtpToken(r.token)
      setExpiresAt(new Date(r.expires_at))
      setResendAfter(new Date(Date.now() + 30_000))
      setStep('otp')
    } catch (err) { setError(apiError(err).message) }
    finally { setBusy(false) }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      const r = await authApi.verifyResetOtp({ email, code: otp }, otpToken)
      setResetToken(r.reset_token ?? null)
      setStep('password')
    } catch (err) { setError(apiError(err).message); setOtp('') }
    finally { setBusy(false) }
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (! resetToken) { setError('Reset session expired. Please request a new code.'); return }
    setBusy(true)
    setError(null)
    try {
      await authApi.resetPassword({ email, reset_token: resetToken, password, password_confirmation: confirm })
      navigate('/login')
    } catch (err) { setError(apiError(err).message) }
    finally { setBusy(false) }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setBusy(true)
    try {
      const r = await authApi.resendResetOtp(email)
      setOtpToken(r.token)
      setExpiresAt(new Date(r.expires_at))
      setResendAfter(new Date(Date.now() + 30_000))
    } catch (err) { setError(apiError(err).message) }
    finally { setBusy(false) }
  }

  const ttl = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)) : 0

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a verification code to your email.">
      <StepDots steps={['Email', 'Verify', 'New password']} current={step === 'email' ? 0 : step === 'otp' ? 1 : 2} />

      {error && <div className="form-error">{error}</div>}

      {step === 'email' && (
        <form onSubmit={submitEmail}>
          <div className="field">
            <label htmlFor="forgot-email">Email address</label>
            <input id="forgot-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Sending…' : 'Send verification code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp}>
          <div className="form-success">If an account exists for {email}, a verification code has been sent.</div>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <p className="help-inline">Code expires in {Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</p>
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Verify code'}
          </button>
          <div className="otp-resend">
            Didn't receive a code?
            <button type="button" onClick={resend} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword}>
          <div className="field">
            <label htmlFor="reset-pw-1">New password</label>
            <input id="reset-pw-1" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            <p className="hint">At least 8 characters.</p>
          </div>
          <div className="field">
            <label htmlFor="reset-pw-2">Confirm password</label>
            <input id="reset-pw-2" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            {confirm && confirm !== password && <p className="help-inline is-bad">Passwords do not match.</p>}
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      {step === 'email' && (
        <p className="muted text-3 mt-2" style={{ textAlign: 'center' }}>
          <Link to="/login">Back to login</Link>
        </p>
      )}
    </AuthShell>
  )
}
