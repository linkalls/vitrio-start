import type { PageMetadata } from '../../route'

export const metadata: PageMetadata = {
  title: 'About',
  description: 'About vitrio-start — a Next.js alternative for Cloudflare Workers',
  openGraph: {
    title: 'About vitrio-start',
    description: 'A Bun-first, SSR-first framework without server action magic',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div class="max-w-3xl">
      <h1 class="text-3xl font-semibold tracking-tight">About vitrio-start</h1>
      <p class="mt-4 leading-relaxed text-zinc-300">
        vitrio-start is a Bun-first, SSR-first starter for building web applications on
        Cloudflare Workers. It is designed as a Next.js alternative that avoids server
        action / RPC magic and keeps the code small and AI-friendly.
      </p>

      <div class="mt-10 grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">No magic</div>
          <p class="mt-2 text-sm text-zinc-400">
            Plain HTTP + PRG. No hidden RPC endpoints, no auto-generated routes. Every request
            flow is explicit and readable.
          </p>
        </div>

        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">File-based routing</div>
          <p class="mt-2 text-sm text-zinc-400">
            Next.js-style <code class="font-mono text-zinc-300">src/pages/</code> directory.
            Dynamic segments via <code class="font-mono text-zinc-300">[param]</code>, catch-all
            via <code class="font-mono text-zinc-300">[...slug]</code>.
          </p>
        </div>

        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">Automatic layouts</div>
          <p class="mt-2 text-sm text-zinc-400">
            Place a <code class="font-mono text-zinc-300">layout.tsx</code> in any pages directory
            and it wraps all routes in that segment — same pattern as Next.js App Router.
          </p>
        </div>

        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">API routes</div>
          <p class="mt-2 text-sm text-zinc-400">
            Add a <code class="font-mono text-zinc-300">route.ts</code> alongside any page to
            create a JSON API endpoint. Export named functions{' '}
            <code class="font-mono text-zinc-300">GET</code>,{' '}
            <code class="font-mono text-zinc-300">POST</code>, etc.
          </p>
        </div>

        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">Per-page metadata</div>
          <p class="mt-2 text-sm text-zinc-400">
            Export <code class="font-mono text-zinc-300">metadata</code> from any page file to set
            the page title, description, Open Graph tags, and more.
          </p>
        </div>

        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div class="text-sm font-semibold">Route groups</div>
          <p class="mt-2 text-sm text-zinc-400">
            Directories named <code class="font-mono text-zinc-300">(group)</code> are ignored in
            the URL but share a layout — ideal for auth segments and feature grouping.
          </p>
        </div>
      </div>

      <div class="mt-12 flex items-center gap-4">
        <a
          href="/"
          class="inline-flex items-center rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-white"
        >
          ← Home
        </a>
        <a
          href="/reference"
          class="inline-flex items-center rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
        >
          Reference
        </a>
      </div>
    </div>
  )
}
