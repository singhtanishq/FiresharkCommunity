import { attachmentUrl } from '../../lib/format'

interface AvatarProps {
  name: string
  path?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, path, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const src = attachmentUrl(path)

  return (
    <span className={`avatar avatar--${size === 'md' ? 'md' : size}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials || '?'}
    </span>
  )
}
