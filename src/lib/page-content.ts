const MAX_CHARS = 8_000

const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

/**
 * Fetch a web page and extract its readable text content.
 * Tries multiple CORS proxies in order until one succeeds.
 */
export async function fetchPageText(url: string): Promise<string> {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), {
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue

      const html = await res.text()
      const text = extractText(html).slice(0, MAX_CHARS)
      if (text.length > 100) return text
    } catch {
      // try next proxy
    }
  }
  return ''
}

function extractText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Remove non-content elements
  const remove = doc.querySelectorAll(
    'script, style, nav, header, footer, aside, iframe, noscript, svg, [role="navigation"], [role="banner"], [aria-hidden="true"]'
  )
  remove.forEach(el => el.remove())

  // Try <article> or <main> first for better content extraction
  const article = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('[role="main"]')
  const root = article || doc.body

  // Get text, collapse whitespace, clean up
  const text = (root?.textContent || '')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

/**
 * For HN self-posts (Ask HN, Show HN), strip HTML tags from the text field.
 */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').trim()
}
