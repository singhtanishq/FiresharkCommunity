export function EmptyState({ icon = '🗂️', title, action }: { icon?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <p>{title}</p>
      {action}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-state__icon" aria-hidden="true">⚠️</div>
      <p>{message}</p>
      {onRetry && <button className="btn btn--ghost" onClick={onRetry}>Try again</button>}
    </div>
  )
}
