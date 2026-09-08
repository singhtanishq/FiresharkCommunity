import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/fireshark_community.png'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/endpoints'
import { Avatar } from '../ui/Avatar'
import { Search, Menu, X, Bell, User, ChevronDown, Bookmark, Settings, LogOut } from 'lucide-react'

export function Header() {
  const { user, logout, unreadCount, setUnreadCount } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    const load = () => {
      notificationsApi.unreadCount()
        .then((n: number) => { if (active) setUnreadCount(n) })
        .catch(() => undefined)
    }
    load()
    const interval = setInterval(load, 45_000)
    return () => { active = false; clearInterval(interval) }
  }, [user, setUnreadCount])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(`/search?q=${encodeURIComponent(term)}`)
    setNavOpen(false)
  }

  const closeMenu = () => { setNavOpen(false); setMenuOpen(false) }

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="site-header__top">
        <Link to="/" className="brand" aria-label="FireShark Community home" onClick={closeMenu}>
          <img src={logo} alt="FireShark Community" className="brand__logo" />
        </Link>

        <button className="nav-burger" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-label="Toggle navigation">
          {navOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
        </button>

        <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Home</NavLink>
          <NavLink to="/questions" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Questions</NavLink>
          <NavLink to="/categories" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Categories</NavLink>
          <NavLink to="/tags" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Tags</NavLink>
          <NavLink to="/leaderboard" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Leaderboard</NavLink>
        </nav>

        <form className="header-search" role="search" onSubmit={submitSearch}>
          <Search className="header-search__icon" aria-hidden="true" size={20} strokeWidth={2} />
          <input
            className="header-search__input"
            type="search"
            placeholder="Search questions, tags, topics…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
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
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.16)' }}
                >
                  <Avatar name={user.name} path={user.avatar_path} size="sm" />
                  <span style={{ marginLeft: 6 }}>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={16} strokeWidth={2.5} />
                  {unreadCount > 0 && (
                    <span style={{ background: 'var(--fire-500)', color: '#fff', borderRadius: 999, fontSize: 11, padding: '0 6px', fontWeight: 700, marginLeft: 6 }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <div className="dropdown__menu" style={{ background: '#fff', color: 'var(--ink-900)' }}>
                    <Link to={`/users/${user.username}`} onClick={closeMenu}>
                      <User size={16} strokeWidth={2} style={{ marginRight: 8 }} /> My profile
                    </Link>
                    <Link to="/bookmarks" onClick={closeMenu}>
                      <Bookmark size={16} strokeWidth={2} style={{ marginRight: 8 }} /> Bookmarks
                    </Link>
                    <Link to="/notifications" onClick={closeMenu}>
                      <Bell size={16} strokeWidth={2} style={{ marginRight: 8 }} />
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </Link>
                    <Link to="/settings" onClick={closeMenu}>
                      <Settings size={16} strokeWidth={2} style={{ marginRight: 8 }} />
                      Settings
                    </Link>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <>
                        <hr />
                        <Link to="/admin" onClick={closeMenu}>
                          <Settings size={16} strokeWidth={2} style={{ marginRight: 8 }} />
                          Admin dashboard
                        </Link>
                      </>
                    )}
                    <hr />
                    <button onClick={() => { closeMenu(); void logout().then(() => navigate('/')) }}>
                      <LogOut size={16} strokeWidth={2} style={{ marginRight: 8 }} /> Log out
                    </button>
                  </div>
                )}
              </div>
            )
            : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.18)' }}>Log in</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
              </>
            )}
        </div>
      </div>
    </header>
  )
}