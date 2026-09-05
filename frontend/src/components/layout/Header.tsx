import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/endpoints'
import { Avatar } from '../ui/Avatar'

export function Header() {
  const { user, logout, unreadCount, setUnreadCount } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && ! menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (! user) return
    let active = true
    const load = () => {
      notificationsApi.unreadCount()
        .then((count) => { if (active) setUnreadCount(count) })
        .catch(() => undefined)
    }
    load()
    const interval = setInterval(load, 45_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user, setUnreadCount])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const navLink = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand" aria-label="FireShark Community home">
          <span className="brand__mark" aria-hidden="true">🦈</span>
          <span className="brand__name"><b>FireShark</b> Community</span>
        </Link>

        <button className="nav-burger" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-label="Toggle navigation">☰</button>

        <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end className={navLink} onClick={() => setNavOpen(false)}>Home</NavLink>
          <NavLink to="/questions" className={navLink} onClick={() => setNavOpen(false)}>Questions</NavLink>
          <NavLink to="/categories" className={navLink} onClick={() => setNavOpen(false)}>Categories</NavLink>
          <NavLink to="/tags" className={navLink} onClick={() => setNavOpen(false)}>Tags</NavLink>
          <NavLink to="/leaderboard" className={navLink} onClick={() => setNavOpen(false)}>Leaderboard</NavLink>
          <NavLink to="/community-guidelines" className={navLink} onClick={() => setNavOpen(false)}>Guidelines</NavLink>
        </nav>

        <form className="header-search" role="search" onSubmit={submitSearch}>
          <input
            className="input"
            type="search"
            placeholder="Search questions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search questions"
          />
        </form>

        <div className="header-actions">
          <Link to="/ask" className="btn btn--fire btn--sm">Ask Question</Link>

          {user
            ? (
              <div className="dropdown" ref={menuRef}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} path={user.avatar_path} size="sm" />
                  <span className="row" style={{ gap: 6 }}>
                    {user.name.split(' ')[0]}
                    {unreadCount > 0 && (
                      <span style={{ background: 'var(--fire-500)', color: '#fff', borderRadius: 999, fontSize: 11, padding: '0 6px', fontWeight: 700 }}>
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </button>

                {menuOpen && (
                  <div className="dropdown__menu">
                    <Link to={`/users/${user.username}`} onClick={() => setMenuOpen(false)}>My profile</Link>
                    <Link to="/bookmarks" onClick={() => setMenuOpen(false)}>Bookmarks</Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </Link>
                    <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <>
                        <hr />
                        <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin dashboard</Link>
                      </>
                    )}
                    <hr />
                    <button onClick={() => { setMenuOpen(false); void logout(); navigate('/') }}>Log out</button>
                  </div>
                )}
              </div>
            )
            : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
              </>
            )}
        </div>
      </div>
    </header>
  )
}
