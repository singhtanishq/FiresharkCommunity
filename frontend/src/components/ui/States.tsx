import { AlertTriangle, FolderOpen } from 'lucide-react'

export function EmptyState({ icon = <FolderOpen size={32} strokeWidth={1.5} />, title, action }: { icon?: React.ReactNode; title: string; action?: React.ReactNode }) {
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
      <div className="empty-state__icon" aria-hidden="true"><AlertTriangle size={32} strokeWidth={1.5} /></div>
      <p>{message}</p>
      {onRetry && <button className="btn btn--ghost" onClick={onRetry}>Try again</button>}
    </div>
  )
}