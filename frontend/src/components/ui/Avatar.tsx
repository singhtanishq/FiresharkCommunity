import { useState } from 'react'
import { attachmentUrl } from '../../lib/format'

interface AvatarProps {
  name: string
  path?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, path, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initials = (name || 'Anonymous')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const src = attachmentUrl(path)
  const showImg = src && !imgError

  // Size dimensions mapping for precise control
  const dimensions = 
    size === 'sm' ? { width: '28px', height: '28px', fontSize: '0.7rem' } :
    size === 'lg' ? { width: '64px', height: '64px', fontSize: '1.4rem' } :
    { width: '36px', height: '36px', fontSize: '0.85rem' }

  return (
    <span 
      className={`avatar avatar--${size}`} 
      aria-hidden="true"
      style={{
        ...dimensions,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--brand-blue-600), var(--brand-blue-700))',
        color: '#fff',
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
        border: '2px solid var(--surface)',
        transition: 'transform var(--dur-fast) var(--ease)'
      }}
    >
      {showImg ? (
        <img 
          src={src} 
          alt="" 
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </span>
  )
}