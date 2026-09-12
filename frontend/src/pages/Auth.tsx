import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoWhite from '../assets/fireshark_community.png'
import { authApi } from '../api/endpoints'
import { apiError } from '../api/client'
import { 
  Mail, Lock, User, AtSign, ArrowRight, ArrowLeft, 
  ShieldCheck, Terminal, Award, Search, AlertTriangle, CheckCircle2
} from 'lucide-react'

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="auth-shell" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      <div className="auth-shell__art">
        <div className="auth-shell__art-inner" style={{ animation: 'modal-rise var(--dur-slow) var(--ease)' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '2rem', transition: 'transform var(--dur) var(--ease)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
            <img src={logoWhite} alt="FireShark" style={{ height: 38 }} />
          </Link>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Where cybersecurity professionals ask, answer, and learn.
          </h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, lineHeight: 1.6, marginBottom: '2rem' }}>
            The FireShark Community is a public knowledge base run on peer-reviewed intelligence.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li className="row" style={{ gap: '0.75rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <Terminal size={18} color="#64BDE5" /> Practical, hands-on cybersecurity questions
            </li>
            <li className="row" style={{ gap: '0.75rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <Award size={18} color="#fbbf24" /> Monthly leaderboard &amp; reputation badges
            </li>
            <li className="row" style={{ gap: '0.75rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <ShieldCheck size={18} color="#34d399" /> Verified instructors and professionals
            </li>
            <li className="row" style={{ gap: '0.75rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <Search size={18} color="#a78bfa" /> Searchable knowledge that grows with you
            </li>
          </ul>
        </div>
      </div>
      <div className="auth-shell__form">
        <div className="auth-shell__card panel" style={{ padding: '2.5rem 2rem', border: 'none', boxShadow: 'var(--shadow-lg)', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{title}</h1>
          {subtitle && <p className="muted" style={{ marginTop: '0.2rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

function StepDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="step-list" style={{ marginBottom: '2rem', gap: '0.4rem' }}>
      {steps.map((s, i) => {
        const isActive = i === current
        const isDone = i < current
        return (
          <li 
            key={s} 
            className={isActive ? 'is-active' : isDone ? 'is-done' : ''}
            style={{
              transition: 'all var(--dur) var(--ease)',
              padding: '0.6rem 0.4rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              borderBottom: isActive ? '2px solid var(--brand-blue-600)' : isDone ? '2px solid var(--success)' : '2px solid transparent',
              background: isActive ? 'var(--brand-blue-50)' : isDone ? 'var(--success-bg)' : 'var(--surface-2)',
              borderColor: isActive ? 'var(--brand-blue-400)' : isDone ? '#bbf7d0' : 'var(--border)'
            }}
          >
            <b style={{ fontSize: '0.75rem', opacity: isActive || isDone ? 1 : 0.6 }}>STEP {i + 1}</b>
            <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.8rem', opacity: isActive || isDone ? 1 : 0.7 }}>{s}</span>
          </li>
        )
      })}
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
    <div className="otp-grid" style={{ gap: '0.6rem' }}>
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
          style={{ 
            fontSize: '1.5rem', 
            height: '3.5rem', 
            borderRadius: 'var(--radius-md)',
            boxShadow: value[i] ? '0 0 0 1px var(--brand-blue-400) inset' : 'none',
            background: value[i] ? 'var(--brand-blue-50)' : 'var(--surface)',
            transition: 'all var(--dur-fast) var(--ease)'
          }}
        />
      ))}
    </div>
  )
}

// =====================================================================
// LOGIN
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
    if (!resendAfter) return
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
      <StepDots steps={['Credentials', 'Verification']} current={step === 'password' ? 0 : 1} />

      {error && (
        <div className="banner banner--danger mb-2" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="field">
            <label htmlFor="login-email">Email or username</label>
            <div className="input-affix">
              <User className="input-affix__icon" size={18} />
              <input id="login-email" className="input input--with-affix input--lg" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" autoFocus placeholder="e.g. jdoe@example.com" />
            </div>
          </div>
          <div className="field">
            <div className="row row--between mb-1">
              <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="text-3 muted font-medium">Forgot password?</Link>
            </div>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={18} />
              <input id="login-password" type="password" className="input input--with-affix input--lg" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
            </div>
          </div>
          <button className="btn btn--primary btn--block btn--lg mt-3" disabled={busy}>
            {busy ? 'Authenticating…' : <><ArrowRight size={18} /> Continue to verification</>}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <div className="row row--between mt-1">
              <p className="help-inline" style={{ margin: 0 }}>Code expires in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</b></p>
              <div className="otp-resend" style={{ margin: 0 }}>
                <button type="button" onClick={resend} disabled={cooldown > 0 || busy} style={{ fontSize: '0.82rem' }}>
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
          <button className="btn btn--primary btn--block btn--lg mt-3" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : <><ShieldCheck size={18} /> Verify & sign in</>}
          </button>
          
          <div className="divider">Or</div>
          
          <button type="button" className="btn btn--ghost btn--block" onClick={() => { setStep('password'); setOtp(''); setError(null) }}>
            <ArrowLeft size={16} /> Back to password
          </button>
        </form>
      )}

      {step === 'password' && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          New to the community? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      )}
    </AuthShell>
  )
}

// =====================================================================
// REGISTER
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
    if (!resendAfter) return
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
      title="Join the Community"
      subtitle={
        step === 'details' ? 'Create an account to participate.'
        : step === 'otp' ? `Verify the code sent to ${form.email}.`
        : 'Secure your account with a strong password.'
      }
    >
      <StepDots steps={['Profile', 'Verification', 'Security']} current={step === 'details' ? 0 : step === 'otp' ? 1 : 2} />

      {error && (
        <div className="banner banner--danger mb-2" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={submitDetails} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="reg-name">Full name</label>
              <div className="input-affix">
                <User className="input-affix__icon" size={16} />
                <input id="reg-name" className="input input--with-affix" value={form.name} onChange={update('name')} required autoFocus placeholder="Jane Doe" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="reg-username">Username</label>
              <div className="input-affix">
                <AtSign className="input-affix__icon" size={16} />
                <input id="reg-username" className={`input input--with-affix ${usernameStatus === 'taken' ? 'input--error' : ''}`} value={form.username} onChange={update('username')} required minLength={3} maxLength={30} placeholder="janedoe" />
              </div>
              {usernameStatus !== 'idle' && usernameHint && (
                <p className={`help-inline ${usernameStatus === 'ok' ? 'is-ok' : 'is-bad'}`} style={{ marginTop: '0.2rem' }}>
                  {usernameStatus === 'checking' ? 'Checking...' : (usernameStatus === 'ok' ? '✓ ' : '✕ ') + usernameHint}
                </p>
              )}
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="reg-email">Email Address</label>
            <div className="input-affix">
              <Mail className="input-affix__icon" size={16} />
              <input id="reg-email" type="email" className="input input--with-affix input--lg" value={form.email} onChange={update('email')} required placeholder="name@company.com" />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={16} />
              <input id="reg-password" type="password" className="input input--with-affix input--lg" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" placeholder="••••••••" />
            </div>
            <p className="hint">Must be at least 8 characters long.</p>
          </div>
          
          <button
            type="submit"
            className="btn btn--fire btn--block btn--lg mt-3"
            disabled={busy || !form.name || !form.username || !form.email || form.password.length < 8}
          >
            {busy ? 'Sending verification…' : <><ArrowRight size={18} /> Continue</>}
          </button>
        </form>
      )}

      {/* OTP and Password steps mirror the visual upgrades applied to Login */}
      {step === 'otp' && (
        <form onSubmit={submitOtp} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <div className="row row--between mt-1">
              <p className="help-inline" style={{ margin: 0 }}>Code expires in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</b></p>
              <div className="otp-resend" style={{ margin: 0 }}>
                <button type="button" onClick={resend} disabled={cooldown > 0 || busy} style={{ fontSize: '0.82rem' }}>
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg mt-3" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : <><ShieldCheck size={18} /> Verify email</>}
          </button>
          
          <div className="divider">Or</div>
          
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep('details')}>
            <ArrowLeft size={16} /> Edit profile details
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="banner banner--success mb-3">
            <CheckCircle2 size={18} /> Email verified successfully. Set your final password.
          </div>
          <div className="field">
            <label htmlFor="reg-pw-1">Secure Password</label>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={16} />
              <input id="reg-pw-1" type="password" className="input input--with-affix input--lg" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="reg-pw-2">Confirm Password</label>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={16} />
              <input id="reg-pw-2" type="password" className={`input input--with-affix input--lg ${confirm && confirm !== form.password ? 'input--error' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            {confirm && confirm !== form.password && <p className="help-inline is-bad mt-1">Passwords do not match.</p>}
          </div>
          <button type="submit" className="btn btn--fire btn--block btn--lg mt-3" disabled={busy || !confirm || confirm !== form.password}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      {step === 'details' && (
        <>
          <p className="muted" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Already a member? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
          </p>
          <p className="muted text-3" style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            By registering, you agree to our <Link to="/community-guidelines">Community Guidelines</Link>.
          </p>
        </>
      )}
    </AuthShell>
  )
}

// =====================================================================
// FORGOT PASSWORD
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
    if (!resendAfter) return
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
    if (!resetToken) { setError('Reset session expired. Please request a new code.'); return }
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
    <AuthShell title="Reset Password" subtitle="Enter your email to receive a secure recovery code.">
      <StepDots steps={['Request', 'Verify', 'Reset']} current={step === 'email' ? 0 : step === 'otp' ? 1 : 2} />

      {error && (
        <div className="banner banner--danger mb-2" style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={submitEmail} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="field">
            <label htmlFor="forgot-email">Account Email</label>
            <div className="input-affix">
              <Mail className="input-affix__icon" size={18} />
              <input id="forgot-email" type="email" className="input input--with-affix input--lg" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="e.g. jdoe@example.com" />
            </div>
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg mt-3" disabled={busy}>
            {busy ? 'Sending…' : <><ArrowRight size={18} /> Send recovery code</>}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="banner banner--info mb-3">
            If an account exists for {email}, a code has been sent.
          </div>
          <div className="field">
            <OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus />
            <div className="row row--between mt-1">
              <p className="help-inline" style={{ margin: 0 }}>Code expires in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(ttl / 60)}:{String(ttl % 60).padStart(2, '0')}</b></p>
              <div className="otp-resend" style={{ margin: 0 }}>
                <button type="button" onClick={resend} disabled={cooldown > 0 || busy} style={{ fontSize: '0.82rem' }}>
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg mt-3" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : <><ShieldCheck size={18} /> Verify code</>}
          </button>
          
          <div className="divider">Or</div>
          
          <button type="button" className="btn btn--ghost btn--block" onClick={() => { setStep('email'); setOtp(''); setError(null) }}>
            <ArrowLeft size={16} /> Try a different email
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword} style={{ animation: 'fade-in var(--dur) var(--ease)' }}>
          <div className="field">
            <label htmlFor="reset-pw-1">New Password</label>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={18} />
              <input id="reset-pw-1" type="password" className="input input--with-affix input--lg" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <p className="hint">At least 8 characters required.</p>
          </div>
          <div className="field">
            <label htmlFor="reset-pw-2">Confirm New Password</label>
            <div className="input-affix">
              <Lock className="input-affix__icon" size={18} />
              <input id="reset-pw-2" type="password" className={`input input--with-affix input--lg ${confirm && confirm !== password ? 'input--error' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            {confirm && confirm !== password && <p className="help-inline is-bad mt-1">Passwords do not match.</p>}
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg mt-3" disabled={busy || !confirm || confirm !== password}>
            {busy ? 'Resetting…' : 'Secure my account'}
          </button>
        </form>
      )}

      {step === 'email' && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/login" className="btn btn--quiet">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      )}
    </AuthShell>
  )
}