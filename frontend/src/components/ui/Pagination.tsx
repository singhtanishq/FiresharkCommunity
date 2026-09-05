import { Link } from 'react-router-dom'

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
    <nav className="pagination" aria-label="Pagination">
      {meta.current_page > 1 && <Link to={join(meta.current_page - 1)}>‹ Prev</Link>}
      {start > 1 && (
        <>
          <Link to={join(1)}>1</Link>
          {start > 2 && <span className="is-disabled">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link key={p} to={join(p)} className={p === meta.current_page ? 'is-active' : ''}>{p}</Link>
      ))}
      {end < meta.last_page && (
        <>
          <span className="is-disabled">…</span>
          <Link to={join(meta.last_page)}>{meta.last_page}</Link>
        </>
      )}
      {meta.current_page < meta.last_page && <Link to={join(meta.current_page + 1)}>Next ›</Link>}
    </nav>
  )
}
