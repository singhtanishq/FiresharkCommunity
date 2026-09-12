import { AlertTriangle, FolderOpen, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ icon = <FolderOpen size={40} strokeWidth={1.5} />, title, action }: { icon?: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div 
      className="empty-state" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '3.5rem 2rem', 
        textAlign: 'center',
        animation: 'fade-in var(--dur-slow) var(--ease)'
      }}
    >
      <div 
        className="empty-state__icon" 
        aria-hidden="true" 
        style={{ 
          color: 'var(--brand-blue-400)', 
          marginBottom: '1rem',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink-800)', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
        {title}
      </p>
      {action && (
        <div style={{ animation: 'modal-rise var(--dur-fast) var(--ease)' }}>
          {action}
        </div>
      )}
    </div>
  )
}

export function Spinner() {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '4rem 0',
        width: '100%',
        animation: 'fade-in var(--dur-fast) var(--ease)'
      }}
      role="status" 
      aria-label="Loading"
    >
      <div 
        className="spinner" 
        style={{ 
          color: 'var(--brand-blue-600)',
          animation: 'spin 0.8s linear infinite'
        }} 
      >
        <Loader2 size={36} strokeWidth={2.5} />
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div 
      className="empty-state" 
      role="alert"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '3.5rem 2rem', 
        textAlign: 'center',
        animation: 'fade-in var(--dur-slow) var(--ease)'
      }}
    >
      <div 
        className="empty-state__icon" 
        aria-hidden="true" 
        style={{ 
          color: 'var(--danger)', 
          marginBottom: '1rem',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        <AlertTriangle size={40} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink-900)', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry} style={{ borderRadius: '99px', padding: '0.5rem 1.25rem' }}>
          Try again
        </button>
      )}
    </div>
  )
}