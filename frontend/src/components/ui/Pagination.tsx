import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ meta, baseUrl, pageParam = 'page' }: {
  meta: { current_page: number; last_page: number }
  baseUrl: string
  pageParam?: string
}) {
  if (meta.last_page <= 1) return null

  const join = (page: number) => {
    const sep = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${sep}${pageParam}=${page}`
  }

  const pages: number[] = []
  const start = Math.max(1, meta.current_page - 2)
  const end = Math.min(meta.last_page, meta.current_page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav 
      className="pagination" 
      aria-label="Pagination"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.4rem', 
        margin: '2.5rem 0 1rem',
        animation: 'fade-in var(--dur-slow) var(--ease)'
      }}
    >
      {/* Previous Page Link */}
      {meta.current_page > 1 && (
        <Link 
          to={join(meta.current_page - 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink-900)',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
            transition: 'all var(--dur-fast) var(--ease)'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-blue-500)'; e.currentTarget.style.color = 'var(--brand-blue-600)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-900)' }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} /> Prev
        </Link>
      )}

      {/* Start Ellipsis & First Page */}
      {start > 1 && (
        <>
          <Link 
            to={join(1)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink-900)',
              fontWeight: 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              transition: 'all var(--dur-fast) var(--ease)'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-blue-500)'; e.currentTarget.style.color = 'var(--brand-blue-600)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-900)' }}
          >
            1
          </Link>
          {start > 2 && <span className="is-disabled" style={{ padding: '0 0.25rem', color: 'var(--text-3)' }}>…</span>}
        </>
      )}

      {/* Numbered Page Links */}
      {pages.map((p) => {
        const isActive = p === meta.current_page
        return (
          <Link 
            key={p} 
            to={join(p)} 
            className={isActive ? 'is-active' : ''}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius)',
              border: '1px solid',
              borderColor: isActive ? 'var(--brand-blue-600)' : 'var(--border)',
              background: isActive ? 'var(--brand-blue-600)' : 'var(--surface)',
              color: isActive ? '#fff' : 'var(--ink-900)',
              fontWeight: isActive ? 700 : 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: isActive ? '0 4px 12px rgba(22, 122, 201, 0.25)' : 'none',
              transition: 'all var(--dur-fast) var(--ease)'
            }}
            onMouseOver={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'var(--brand-blue-500)'
                e.currentTarget.style.color = 'var(--brand-blue-600)'
              }
            }}
            onMouseOut={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--ink-900)'
              }
            }}
          >
            {p}
          </Link>
        )
      })}

      {/* End Ellipsis & Last Page */}
      {end < meta.last_page && (
        <>
          <span className="is-disabled" style={{ padding: '0 0.25rem', color: 'var(--text-3)' }}>…</span>
          <Link 
            to={join(meta.last_page)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink-900)',
              fontWeight: 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              transition: 'all var(--dur-fast) var(--ease)'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-blue-500)'; e.currentTarget.style.color = 'var(--brand-blue-600)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-900)' }}
          >
            {meta.last_page}
          </Link>
        </>
      )}

      {/* Next Page Link */}
      {meta.current_page < meta.last_page && (
        <Link 
          to={join(meta.current_page + 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink-900)',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
            transition: 'all var(--dur-fast) var(--ease)'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-blue-500)'; e.currentTarget.style.color = 'var(--brand-blue-600)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-900)' }}
        >
          Next <ChevronRight size={16} strokeWidth={2.5} />
        </Link>
      )}
    </nav>
  )
}