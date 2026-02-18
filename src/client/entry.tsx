// Client entry (loaded only for routes with RouteDef.client=true).
// Goal: small, page-enhancing JS ("use client"-style) while keeping SSR content usable.

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)

  // Fallback
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      ok ? resolve() : reject(new Error('copy failed'))
    } catch (e) {
      reject(e)
    }
  })
}

function enhanceCopyButtons() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-copy]'))
  for (const btn of buttons) {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') ?? ''
      if (!text) return

      const prev = btn.textContent
      try {
        await copyToClipboard(text)
        btn.textContent = 'Copied'
        btn.setAttribute('data-copied', '1')
        setTimeout(() => {
          btn.textContent = prev ?? 'Copy'
          btn.removeAttribute('data-copied')
        }, 1200)
      } catch {
        btn.textContent = 'Failed'
        setTimeout(() => {
          btn.textContent = prev ?? 'Copy'
        }, 1200)
      }
    })
  }
}

function setActiveToc(hash: string) {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'))
  for (const a of links) {
    const isActive = a.getAttribute('href') === hash
    a.classList.toggle('bg-zinc-950/60', isActive)
    a.classList.toggle('text-zinc-100', isActive)
    a.classList.toggle('text-zinc-300', !isActive)
  }
}

function enhanceTocActiveSection() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'))
  const ids = links
    .map((a) => (a.getAttribute('href') ?? '').trim())
    .filter((h) => h.startsWith('#'))
    .map((h) => h.slice(1))

  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((x): x is HTMLElement => !!x)

  if (sections.length === 0) return

  const onIntersect: IntersectionObserverCallback = (entries) => {
    // pick the top-most intersecting entry
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0))[0]

    if (!visible?.target) return
    const id = (visible.target as HTMLElement).id
    if (id) setActiveToc('#' + id)
  }

  const io = new IntersectionObserver(onIntersect, {
    root: null,
    // Trigger a bit before the heading reaches the top (Next.js docs-ish).
    rootMargin: '-25% 0px -70% 0px',
    threshold: [0, 1],
  })

  for (const s of sections) io.observe(s)

  // Initial state
  if (location.hash) setActiveToc(location.hash)
  else setActiveToc('#' + sections[0].id)

  window.addEventListener('hashchange', () => setActiveToc(location.hash))
}

import { hydrateIslands } from './islands'

async function main() {
  // 1) Islands: upgrade interactive components (mount into markers)
  // Users register their islands here.
  // auto-generated registry (src/islands/*.client.tsx)
  // see scripts/gen-islands.ts
  const { islands } = await import('./islands.gen')
  hydrateIslands(islands)

  // 2) Small global enhancements
  enhanceCopyButtons()

  // 3) TOC enhancement (feature-detected)
  if (document.querySelector('a[data-toc-link]')) {
    enhanceTocActiveSection()
  }
}

main().catch((e) => console.error('[vitrio] client entry failed', e))
