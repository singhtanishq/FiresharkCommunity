import { Link } from 'react-router-dom'
import logo from '../../assets/fireshark_community.png'
import { ExternalLink, ShieldCheck } from 'lucide-react'

export function Footer() {
  return (
    <footer className="site-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .site-footer__inner {
            text-align: center !important;
            align-items: center !important;
          }
          .site-footer__inner > div {
            display: flex;
            flex-direction: column;
            align-items: center !important;
          }
          .site-footer__legal {
            text-align: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="site-footer__inner" style={{ padding: '3rem 1rem 2rem', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Brand Column */}
        <div>
          <Link 
            to="/" 
            className="brand" 
            style={{ color: '#fff', display: 'inline-flex', marginBottom: '1rem', textDecoration: 'none' }}
          >
            <span className="brand__mark">
              <img src={logo} alt="FireShark Community" style={{ height: '32px', width: 'auto' }} />
            </span>
          </Link>
          <p className="site-footer__brandline" style={{ color: 'rgba(230, 237, 247, 0.65)', lineHeight: 1.6, fontSize: '0.9rem', wordBreak: 'break-word' }}>
            Ask questions. Share knowledge. Build expertise. A public intelligence network for cybersecurity professionals, ethical hackers, and technology enthusiasts.
          </p>
          <div className="row mt-2" style={{ gap: '0.5rem', color: 'rgba(230, 237, 247, 0.4)', fontSize: '0.8rem', flexWrap: 'wrap', justifyContent: 'inherit' }}>
            <ShieldCheck size={14} color="#34d399" style={{ flexShrink: 0 }} /> Peer-reviewed ecosystem
          </div>
        </div>

        {/* Community Links */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontWeight: 700 }}>
            Community
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'inherit' }}>
            <Link to="/questions" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>Questions</Link>
            <Link to="/categories" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>Categories</Link>
            <Link to="/tags" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>System Tags</Link>
            <Link to="/leaderboard" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>Hall of Fame</Link>
          </div>
        </div>

        {/* About Links */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontWeight: 700 }}>
            Governance
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'inherit' }}>
            <Link to="/community-guidelines" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>Community Guidelines</Link>
            <Link to="/about" style={{ transition: 'color var(--dur-fast) var(--ease)' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>About This Platform</Link>
          </div>
        </div>

        {/* FireShark Ecosystem Links */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontWeight: 700 }}>
            FireShark Ecosystem
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'inherit' }}>
            <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer" className="row" style={{ gap: '0.3rem', alignItems: 'center', transition: 'color var(--dur-fast) var(--ease)', flexWrap: 'wrap', justifyContent: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>
              FireShark <ExternalLink size={12} opacity={0.6} style={{ flexShrink: 0 }} />
            </a>
            <a href="https://academy.fireshark.in/" target="_blank" rel="noopener noreferrer" className="row" style={{ gap: '0.3rem', alignItems: 'center', transition: 'color var(--dur-fast) var(--ease)', flexWrap: 'wrap', justifyContent: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>
              Academy <ExternalLink size={12} opacity={0.6} style={{ flexShrink: 0 }} />
            </a>
            <a href="https://courses.fireshark.in/" target="_blank" rel="noopener noreferrer" className="row" style={{ gap: '0.3rem', alignItems: 'center', transition: 'color var(--dur-fast) var(--ease)', flexWrap: 'wrap', justifyContent: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>
              Courses <ExternalLink size={12} opacity={0.6} style={{ flexShrink: 0 }} />
            </a>
            <a href="https://fireshark.ai/" target="_blank" rel="noopener noreferrer" className="row" style={{ gap: '0.3rem', alignItems: 'center', transition: 'color var(--dur-fast) var(--ease)', flexWrap: 'wrap', justifyContent: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(230, 237, 247, 0.78)'}>
              Our Services <ExternalLink size={12} opacity={0.6} style={{ flexShrink: 0 }} />
            </a>
          </div>
        </div>

      </div>
      
      {/* Legal Footer Bottom Bar */}
      <div className="site-footer__legal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: 'var(--container)', margin: '0 auto', padding: '1.25rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', boxSizing: 'border-box' }}>
        <div>
          © {new Date().getFullYear()} FireShark Technologies. All rights reserved.
        </div>
        <div className="row" style={{ gap: '1rem', color: 'rgba(230, 237, 247, 0.55)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Secure Knowledge Network</span>
          <span>•</span>
          <Link to="/community-guidelines" style={{ color: 'inherit' }}>Guidelines</Link>
        </div>
      </div>
    </footer>
  )
}