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
  
  // Scroll tracking states
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 4)
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up')
      }
      lastScrollY = currentScrollY
    }
    
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
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''} ${scrollDirection === 'down' && scrolled ? 'site-header--compressed' : ''}`}>
      
      {/* Surgical CSS overrides to enforce perfect responsiveness regardless of global styles */}
      <style>{`
        .site-header {
          position: sticky !important;
          top: 0;
          z-index: 999;
          background: rgba(11, 18, 32, 0.96) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          height: auto !important; 
          width: 100%;
          box-sizing: border-box;
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 1rem;
          width: 100%;
          max-width: var(--container, 1400px);
          margin: 0 auto;
          box-sizing: border-box;
          flex-wrap: nowrap;
        }

        .header-top-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .header-collapsible {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          justify-content: flex-end;
          min-width: 0;
        }

        .header-search {
          flex: 1 1 150px;
          max-width: 420px;
          min-width: 120px;
          margin: 0;
          position: relative;
        }
        
        .header-search__input {
          width: 100%;
          box-sizing: border-box;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .mobile-ask-btn {
          display: none !important;
        }

        /* Mobile specific overrides */
        @media (max-width: 768px) {
          .header-container {
            flex-direction: column;
            align-items: stretch;
            padding: 0.6rem 1rem;
            gap: 0;
          }
          
          .header-top-row {
            width: 100%;
            justify-content: space-between;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          
          .header-collapsible {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            overflow: hidden;
            transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
            max-height: 500px;
            opacity: 1;
            margin-top: 0.75rem;
          }
          
          /* Compression state when scrolling down on mobile */
          .site-header--compressed .header-collapsible {
            max-height: 0;
            opacity: 0;
            margin-top: 0;
            pointer-events: none;
          }

          .header-search {
            max-width: 100%;
            width: 100%;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          /* Relocate Ask Question button to top row for mobile */
          .desktop-ask-btn {
            display: none !important;
          }
          
          .mobile-ask-btn {
            display: inline-flex !important;
            margin-left: auto;
            margin-right: 0.75rem;
          }
        }

        @media (max-width: 380px) {
          .hide-on-very-small { display: none; }
          .mobile-ask-btn .btn { padding: 0.4rem 0.6rem !important; }
        }
      `}</style>

      <div className="header-container">
        
        {/* Top Row (Always visible) */}
        <div className="header-top-row">
          <Link to="/" className="brand" aria-label="FireShark Community home" onClick={closeMenu}>
            <span className="brand__mark" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="FireShark Community" style={{ height: '32px', width: 'auto' }} />
            </span>
          </Link>

          {/* Mobile Only: Ask Question Button */}
          <div className="mobile-only mobile-ask-btn">
            <Link to="/ask" className="btn btn--fire btn--sm" style={{ padding: '0.4rem 0.85rem', borderRadius: '99px' }} onClick={closeMenu}>
              <Plus size={16} strokeWidth={2.5} /> <span className="hide-on-very-small" style={{ marginLeft: 4 }}>Ask</span>
            </Link>
          </div>

          {/* Mobile Nav Burger */}
          <button className="nav-burger" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-label="Toggle navigation" style={{ flexShrink: 0 }}>
            {navOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Collapsible Section (Search, Nav, Actions) */}
        <div className="header-collapsible">
          
          {/* Main Navigation Links */}
          <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main" style={{ gap: '0.3rem' }}>
            <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Home</NavLink>
            <NavLink to="/questions" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Questions</NavLink>
            <NavLink to="/categories" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Categories</NavLink>
            <NavLink to="/tags" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Tags</NavLink>
            <NavLink to="/leaderboard" onClick={closeMenu} className={({ isActive }) => (isActive ? 'is-active' : '')}>Leaderboard</NavLink>
          </nav>

          {/* Search Bar */}
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <Search className="header-search__icon" aria-hidden="true" size={16} strokeWidth={2.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="header-search__input input"
              type="search"
              placeholder="Search Nmap, Burp, IAM..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search"
              style={{ paddingLeft: '38px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem' }}
            />
          </form>

          {/* Actions & Profile Dropdown */}
          <div className="header-actions">
            
            {/* Desktop Only: Ask Question Button */}
            <Link to="/ask" className="btn btn--fire btn--sm desktop-ask-btn" style={{ padding: '0.5rem 1rem', borderRadius: '99px' }}>
              <Plus size={16} strokeWidth={2.5} /> <span style={{ display: 'inline' }}>Ask Question</span>
            </Link>
            
            {user ? (
              <div className="dropdown" ref={menuRef} style={{ position: 'relative' }}>
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
                    gap: '0.5rem',
                    width: '100%',
                    justifyContent: 'center'
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
                      minWidth: '220px',
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 0.5rem)',
                      zIndex: 1000
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
                        <Bell size={16} strokeWidth={2} style={{ marginRight: '18px', color: 'var(--brand-blue-600)', flexShrink: 0 }} /> Notifications
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
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '99px', padding: '0.5rem 1.1rem', flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  onClick={closeMenu}
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn--primary btn--sm" 
                  style={{ borderRadius: '99px', padding: '0.5rem 1.25rem', flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  onClick={closeMenu}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}