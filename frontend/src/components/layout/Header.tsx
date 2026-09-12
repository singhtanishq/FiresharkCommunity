import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/fireshark_community.png'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/endpoints'
import { Avatar } from '../ui/Avatar'
import { 
  Search, Menu, X, Bell, User, ChevronDown, 
  Bookmark, Settings, LogOut, ShieldCheck, Plus 
} from 'lucide-react'

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

  const dropdownItemStyle = {
    borderRadius: 'var(--radius)',
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    textDecoration: 'none',
    color: 'var(--ink-900)',
    fontSize: '0.9rem',
    fontWeight: 500,
    width: '100%',
    boxSizing: 'border-box' as const
  }

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="site-header__top" style={{ gap: '2rem' }}>
        
        {/* Brand Logo */}
        <Link to="/" className="brand" aria-label="FireShark Community home" onClick={closeMenu}>
          <span className="brand__mark">
            <img src={logo} alt="FireShark Community" style={{ height: '32px', width: 'auto' }} />
          </span>
        </Link>

        {/* Mobile Nav Burger */}
        <button className="nav-burger" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-label="Toggle navigation">
          {navOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
        </button>

        {/* Main Navigation Links */}
        <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main" style={{ gap: '0.3rem' }}>
          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Home</NavLink>
          <NavLink to="/questions" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Questions</NavLink>
          <NavLink to="/categories" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Ecosystems</NavLink>
          <NavLink to="/tags" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Tags</NavLink>
          <NavLink to="/leaderboard" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Hall of Fame</NavLink>
        </nav>

        {/* Search Bar */}
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <Search className="header-search__icon" aria-hidden="true" size={16} strokeWidth={2.5} />
          <input
            className="header-search__input"
            type="search"
            placeholder="Search Nmap, Burp, AWS IAM..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
          />
        </form>

        {/* Actions & Profile Dropdown */}
        <div className="header-actions" style={{ gap: '0.75rem' }}>
          <Link to="/ask" className="btn btn--fire btn--sm" style={{ padding: '0.5rem 1rem', borderRadius: '99px' }}>
            <Plus size={16} strokeWidth={2.5} /> Ask Question
          </Link>
          
          {user ? (
            <div className="dropdown" ref={menuRef}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-label="Account menu"
                style={{ 
                  background: 'rgba(255,255,255,0.08)', 
                  color: '#e6edf7', 
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '99px',
                  padding: '0.35rem 0.75rem 0.35rem 0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar name={user.name} path={user.avatar_path} size="sm" />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '10px', height: '10px', background: '#f2600c', 
                      borderRadius: '50%', border: '2px solid #0b1220' 
                    }} />
                  )}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              </button>

              {menuOpen && (
                <div 
                  className="dropdown__menu" 
                  style={{ 
                    background: 'var(--surface)', 
                    color: 'var(--ink-900)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    padding: '0.5rem',
                    minWidth: '220px'
                  }}
                >
                  <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-900)' }}>{user.name}</div>
                    <div className="muted font-mono" style={{ fontSize: '0.75rem' }}>@{user.username}</div>
                  </div>

                  <Link to={`/users/${user.username}`} onClick={closeMenu} style={dropdownItemStyle}>
                    <User size={16} strokeWidth={2} style={{ marginRight: '10px', color: 'var(--brand-blue-600)', flexShrink: 0 }} /> My profile
                  </Link>
                  <Link to="/bookmarks" onClick={closeMenu} style={dropdownItemStyle}>
                    <Bookmark size={16} strokeWidth={2} style={{ marginRight: '10px', color: 'var(--brand-blue-600)', flexShrink: 0 }} /> Saved Intel
                  </Link>
                  <Link to="/notifications" onClick={closeMenu} style={{ ...dropdownItemStyle, justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <Bell size={16} strokeWidth={2} style={{ marginRight: '10px', color: 'var(--brand-blue-600)', flexShrink: 0 }} /> Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#f2600c', color: '#fff', borderRadius: 999, fontSize: '0.75rem', padding: '0.1rem 0.5rem', fontWeight: 700, marginLeft: '8px' }}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/settings" onClick={closeMenu} style={dropdownItemStyle}>
                    <Settings size={16} strokeWidth={2} style={{ marginRight: '10px', color: 'var(--brand-blue-600)', flexShrink: 0 }} /> Settings
                  </Link>

                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '0.4rem 0' }} />
                      <Link to="/admin" onClick={closeMenu} style={{ ...dropdownItemStyle, color: 'var(--brand-blue-700)', fontWeight: 600 }}>
                        <ShieldCheck size={16} strokeWidth={2} style={{ marginRight: '10px', flexShrink: 0 }} /> Admin Console
                      </Link>
                    </>
                  )}

                  <div style={{ height: '1px', background: 'var(--border)', margin: '0.4rem 0' }} />
                  
                  <button 
                    onClick={() => { closeMenu(); void logout().then(() => navigate('/')) }}
                    style={{ ...dropdownItemStyle, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    <LogOut size={16} strokeWidth={2} style={{ marginRight: '10px', flexShrink: 0 }} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link 
                to="/login" 
                className="btn btn--ghost btn--sm" 
                style={{ background: 'rgba(255,255,255,0.08)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '99px', padding: '0.5rem 1.1rem' }}
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="btn btn--primary btn--sm" 
                style={{ borderRadius: '99px', padding: '0.5rem 1.25rem' }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}