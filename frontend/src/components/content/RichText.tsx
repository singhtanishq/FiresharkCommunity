import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'
import ini from 'highlight.js/lib/languages/ini'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('json', json)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('ini', ini)

marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Markdown is sanitised with DOMPurify before rendering — user content is
 * never trusted as raw HTML.
 */
export function RichText({ markdown, className = '' }: { markdown: string; className = '' }) {
  const raw = marked.parse(markdown ?? '', { async: false }) as string
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'sup', 'sub',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  })

  return (
    <div
      className={`rich-text ${className}`}
      // Content is sanitised above with a strict allowlist.
      dangerouslySetInnerHTML={{ __html: clean }}
      style={{ animation: 'fade-in var(--dur-fast) var(--ease)' }}
      ref={(el) => {
        if (!el) return
        el.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement)
        })
        
        // Ensure all external links open securely in a new tab
        el.querySelectorAll('a').forEach((link) => {
          if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank')
            link.setAttribute('rel', 'noopener noreferrer')
          }
        })
      }}
    />
  )
}