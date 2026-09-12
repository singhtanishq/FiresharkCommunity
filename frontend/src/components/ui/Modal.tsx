import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export function Modal({ title, onClose, children, footer }: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div 
      className="modal-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-label={typeof title === 'string' ? title : 'Dialog'} 
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        background: 'rgba(11, 18, 32, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        animation: 'fade-in var(--dur-fast) var(--ease)',
        zIndex: 1000
      }}
    >
      <div 
        className="modal"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modal-rise var(--dur) var(--ease)'
        }}
      >
        <div 
          className="modal__header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)',
            flexShrink: 0
          }}
        >
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink-900)', wordBreak: 'break-word' }}>
            {title}
          </h3>
          <button 
            className="modal__close" 
            onClick={onClose} 
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              borderRadius: 'var(--radius)',
              padding: '0.3rem',
              display: 'grid',
              placeItems: 'center',
              transition: 'all var(--dur-fast) var(--ease)',
              flexShrink: 0
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink-900)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="modal__body" style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto' }}>
          {children}
        </div>

        {footer && (
          <div 
            className="modal__footer"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      title={
        <div className="row" style={{ gap: '0.5rem', color: danger ? 'var(--danger)' : 'inherit', flexWrap: 'wrap' }}>
          {danger && <AlertTriangle size={20} style={{ flexShrink: 0 }} />}
          <span style={{ wordBreak: 'break-word' }}>{title}</span>
        </div>
      }
      onClose={onCancel}
      footer={(
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn--quiet" onClick={onCancel} style={{ flex: '1 1 auto' }}>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} style={{ flex: '1 1 auto' }}>
            {confirmLabel ?? 'Confirm'}
          </button>
        </div>
      )}
    >
      <p style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--ink-800)', lineHeight: 1.6, wordBreak: 'break-word' }}>
        {message}
      </p>
    </Modal>
  )
}