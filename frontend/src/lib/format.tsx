export function attachmentUrl(path?: string | null): string | null {
  if (! path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `/storage/${path}`
}

export function timeAgo(date: string | null | undefined): string {
  if (! date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return 'just now'

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ]

  for (const [secs, label] of intervals) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`
  }

  return 'just now'
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function formatDate(date: string | null | undefined): string {
  if (! date) return ''
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Render @mentions as highlighted spans within plain text. */
export function renderMentions(text: string): (string | React.ReactElement)[] {
  return text.split(/(@[a-zA-Z0-9_]{2,30})/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="mention">{part}</span>
      : part,
  )
}

export const verificationLabels: Record<string, string> = {
  team: 'FireShark Team',
  instructor: 'FireShark Instructor',
  expert: 'FireShark Expert',
  alumni: 'FireShark Alumni',
  professional: 'Industry Professional',
}

export const closedReasonLabels: Record<string, string> = {
  duplicate: 'Duplicate',
  too_broad: 'Too broad',
  unclear: 'Unclear',
  off_topic: 'Off-topic',
  requires_support: 'Requires support',
  violates_guidelines: 'Violates community guidelines',
  other: 'Other',
}

export const reportReasonLabels: Record<string, string> = {
  spam: 'Spam',
  abuse: 'Abuse or harassment',
  personal_information: 'Personal information',
  malicious_content: 'Malicious content',
  off_topic: 'Off-topic',
  duplicate: 'Duplicate',
  misleading: 'Misleading information',
  copyright: 'Copyright issue',
  other: 'Other',
}
