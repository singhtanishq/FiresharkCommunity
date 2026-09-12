import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* High-Accessibility Skip to Content Button */}
      <a 
        href="#main-content" 
        className="btn btn--primary" 
        style={{
          position: 'absolute', 
          left: '-9999px', 
          top: '0',
          transition: 'none'
        }}
        onFocus={(e) => { 
          e.currentTarget.style.left = '16px'
          e.currentTarget.style.top = '16px'
          e.currentTarget.style.zIndex = '9999'
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        }}
        onBlur={(e) => { 
          e.currentTarget.style.left = '-9999px' 
        }}
      >
        Skip to main content
      </a>

      {/* Global Navigation Header */}
      <Header />

      {/* Main Dynamic View Outlet */}
      <main 
        id="main-content" 
        style={{ flex: '1 1 auto', width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </main>

      {/* Global Dark-Mode Footer */}
      <Footer />
      
    </div>
  )
}