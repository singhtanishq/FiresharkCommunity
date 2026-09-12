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
  
  // Scroll tracking states for mobile compression
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
      
      {/* Surgical CSS overrides to enforce perfect responsiveness */}
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
          flex-wrap: nowrap;
          gap: 1.5rem;
          padding: 0.75rem 1rem;
          max-width: var(--container, 1400px);
          margin: 0 auto;
          box-sizing: border-box;
        }

        .header-brand-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .mobile-only-actions {
          display: none;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
          margin-right: auto;
        }

        .nav-link-item {
          color: #e6edf7;
          text-decoration: none;
          font-weight: 500;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius);
          transition: background 0.2s, color 0.2s;
        }
        .nav-link-item:hover, .nav-link-item.is-active {
          background: rgba(255,255,255,0.1);
        }

        .header-search {
          flex: 1 1 auto;
          max-width: 420px;
          position: relative !important;
          margin: 0;
        }

        .header-search__input {
          width: 100%;
          padding-left: 40px !important;
          border-radius: 99px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 0.95rem;
          height: 2.5rem;
          box-sizing: border-box;
        }

        .header-search__icon {
          position: absolute !important;
          left: 14px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 10;
          color: rgba(255,255,255,0.6);
          pointer-events: none;
        }

        .desktop-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .mobile-nav-append {
          display: none;
        }

        /* =========================================
           TABLET MODE (769px - 1120px) 
           ========================================= */
        @media (max-width: 1120px) and (min-width: 769px) {
          .header-container { gap: 1rem; }
          .header-brand-row { margin-right: auto; }
          
          .main-nav {
            display: none !important;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #0b1220 !important; /* FIXED: Dark Background */
            flex-direction: column;
            padding: 1rem;
            align-items: stretch;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
          }
          .main-nav.is-open { display: flex !important; }
          
          .nav-link-item {
            color: #e6edf7 !important; /* FIXED: Light text */
            padding: 0.6rem 0.75rem;
          }
          .nav-link-item:hover, .nav-link-item.is-active {
            background: rgba(255,255,255,0.1) !important;
          }
          
          .mobile-only-actions {
            display: flex;
            align-items: center;
          }
          .mobile-ask-btn { display: none !important; }
          
          .nav-burger {
            display: inline-flex;
            background: transparent;
            border: none;
            color: #fff;
            cursor: pointer;
            padding: 0.2rem;
          }
          
          .header-search { max-width: 380px; }
        }

        /* =========================================
           MOBILE MODE (<= 768px) 
           ========================================= */
        @media (max-width: 768px) {
          .header-container {
            flex-wrap: wrap;
            gap: 0.75rem;
            padding: 0.6rem 1rem;
          }
          
          .header-brand-row {
            width: 100%;
            justify-content: space-between;
          }
          
          .mobile-only-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .mobile-ask-btn { display: inline-flex !important; }
          
          .nav-burger {
            display: inline-flex;
            background: transparent;
            border: none;
            color: #fff;
            cursor: pointer;
            padding: 0.2rem;
          }
          
          .header-search {
            width: 100%;
            max-width: 100%;
            order: 3;
            transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
            max-height: 60px;
            opacity: 1;
            overflow: hidden;
          }
          
          .site-header--compressed .header-search {
            max-height: 0;
            opacity: 0;
            margin: 0;
            border: none;
          }

          .desktop-actions { display: none !important; }

          .main-nav {
            display: none !important;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #0b1220 !important; /* FIXED: Dark Background */
            flex-direction: column;
            padding: 1rem;
            align-items: stretch;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
            gap: 0.5rem;
          }
          .main-nav.is-open { display: flex !important; }
          
          .nav-link-item {
            color: #e6edf7 !important; /* FIXED: Light text */
            padding: 0.6rem 0.75rem;
          }
          .nav-link-item:hover, .nav-link-item.is-active { background: rgba(255,255,255,0.1) !important; }

          .mobile-nav-append {
            display: flex;
            flex-direction: column;
            margin-top: 0.5rem;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            padding-top: 1rem;
            gap: 0.25rem;
          }
          
          .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.75rem;
            border-radius: var(--radius);
            color: #e6edf7 !important; /* FIXED: Light text */
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: background 0.2s;
          }
          .mobile-nav-link:hover {
            background: rgba(255,255,255,0.1) !important;
          }
          
          .mobile-auth-btns {
            display: flex;
            gap: 0.75rem;
            width: 100%;
            margin-top: 0.5rem;
          }
          .mobile-auth-btns .btn {
            flex: 1;
            text-align: center;
            justify-content: center;
          }
        }

        @media (max-width: 380px) {
          .hide-on-very-small { display: none; }
          .mobile-ask-btn .btn { padding: 0.4rem 0.6rem !important; }
        }
      `}</style>

      <div className="header-container">
        
        {/* ROW 1: Brand & Mobile Triggers */}
        <div className="header-brand-row">
          <Link to="/" className="brand" aria-label="FireShark Community home" onClick={closeMenu}>
            <span className="brand__mark" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="FireShark Community" style={{ height: '32px', width: 'auto' }} />
            </span>
          </Link>

          <div className="mobile-only-actions">
            <Link to="/ask" className="btn btn--fire btn--sm mobile-ask-btn" style={{ padding: '0.4rem 0.85rem', borderRadius: '99px' }} onClick={closeMenu}>
              <Plus size={16} strokeWidth={2.5} /> <span className="hide-on-very-small" style={{ marginLeft: 4 }}>Ask</span>
            </Link>
            <button className="nav-burger" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-label="Toggle navigation">
              {navOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Collapsible Nav Links (Hidden inline on Tablet/Mobile) */}
        <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => `nav-link-item ${isActive ? 'is-active' : ''}`}>Home</NavLink>
          <NavLink to="/questions" onClick={closeMenu} className={({ isActive }) => `nav-link-item ${isActive ? 'is-active' : ''}`}>Questions</NavLink>
          <NavLink to="/categories" onClick={closeMenu} className={({ isActive }) => `nav-link-item ${isActive ? 'is-active' : ''}`}>Ecosystems</NavLink>
          <NavLink to="/tags" onClick={closeMenu} className={({ isActive }) => `nav-link-item ${isActive ? 'is-active' : ''}`}>Tags</NavLink>
          <NavLink to="/leaderboard" onClick={closeMenu} className={({ isActive }) => `nav-link-item ${isActive ? 'is-active' : ''}`}>Hall of Fame</NavLink>
          
          {/* Appended Mobile Auth/User Menu */}
          <div className="mobile-nav-append">
            {user ? (
              <>
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{user.name}</div>
                  <div className="muted font-mono" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>@{user.username}</div>
                </div>
                <Link to={`/users/${user.username}`} onClick={closeMenu} className="mobile-nav-link">
                  <User size={16} /> My profile
                </Link>
                <Link to="/bookmarks" onClick={closeMenu} className="mobile-nav-link">
                  <Bookmark size={16} /> Saved Intel
                </Link>
                <Link to="/notifications" onClick={closeMenu} className="mobile-nav-link" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={16} /> Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{ background: '#f2600c', color: '#fff', borderRadius: 999, fontSize: '0.75rem', padding: '0.1rem 0.5rem', fontWeight: 700 }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/settings" onClick={closeMenu} className="mobile-nav-link">
                  <Settings size={16} /> Settings
                </Link>
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <Link to="/admin" onClick={closeMenu} className="mobile-nav-link" style={{ color: '#93c5fd', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> Admin Console
                  </Link>
                )}
                <button onClick={() => { closeMenu(); void logout().then(() => navigate('/')) }} className="mobile-nav-link" style={{ color: '#f87171', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <LogOut size={16} /> Log out
                </button>
              </>
            ) : (
              <div className="mobile-auth-btns">
                {/* FIXED: White button with dark text for optimal contrast */}
                <Link to="/login" onClick={closeMenu} className="btn" style={{ background: '#ffffff', color: '#0f172a', fontWeight: 600, border: '1px solid #ffffff' }}>
                  Log in
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn btn--primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* SEARCH BAR (Row 2 on Mobile, Inline on Desktop/Tablet) */}
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <Search className="header-search__icon" aria-hidden="true" size={16} strokeWidth={2.5} />
          <input
            className="header-search__input"
            type="search"
            placeholder="Search Nmap, Burp, IAM..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
          />
        </form>

        {/* DESKTOP/TABLET ACTIONS (Hidden on Mobile) */}
        <div className="desktop-actions">
          <Link to="/ask" className="btn btn--fire btn--sm desktop-ask-btn" style={{ padding: '0.5rem 1.1rem', borderRadius: '99px' }}>
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
                  background: 'rgba(255,255,255,0.08)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '99px', padding: '0.35rem 0.75rem 0.35rem 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar name={user.name} path={user.avatar_path} size="sm" />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#f2600c', 
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
                    background: 'var(--surface)', color: 'var(--ink-900)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
                    padding: '0.5rem', minWidth: '220px', position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', zIndex: 1000
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
              <Link to="/login" className="btn btn--ghost btn--sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#e6edf7', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '99px', padding: '0.5rem 1.1rem' }}>
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm" style={{ borderRadius: '99px', padding: '0.5rem 1.25rem' }}>
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}