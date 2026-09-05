import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="app-shell">
      <a href="#main-content" className="btn btn--ghost btn--sm" style={{
        position: 'absolute', left: -9999, top: 0,
      }}
      onFocus={(e) => { e.currentTarget.style.left = '8px'; e.currentTarget.style.top = '70px'; e.currentTarget.style.zIndex = '200'; e.currentTarget.style.background = '#fff' }}
      onBlur={(e) => { e.currentTarget.style.left = '-9999px' }}
      >
        Skip to content
      </a>
      <Header />
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
