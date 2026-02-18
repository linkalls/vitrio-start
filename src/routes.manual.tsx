import { z } from 'zod'
import { HIGHLIGHT } from './server/highlight'
import { defineRoute, type RouteDef } from './route'

export const manualRoutes: RouteDef[] = [
  defineRoute({
    path: '/',
    loader: () => ({ now: Date.now() }),
    component: ({ data }) => {
      const homeData = z.object({ now: z.number() }).parse(data)
      return (
        <div class="bg-grid">
          <div class="mx-auto max-w-6xl px-6 py-10">
            <div class="flex items-center justify-between">
              <a href="/" class="flex items-center gap-2">
                <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-950">
                  V
                </span>
                <span class="text-sm font-semibold tracking-tight text-zinc-100">
                  vitrio-start
                </span>
              </a>
              <div class="flex items-center gap-2">
                <a
                  href="#quickstart"
                  class="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-950"
                >
                  Quickstart
                </a>
                <a
                  href="/reference"
                  class="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-950"
                >
                  Reference
                </a>
              </div>
            </div>

            <div class="mt-14 grid items-center gap-12 lg:grid-cols-2">
              <div>
                <a
                  href="/reference"
                  class="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-950"
                >
                  <span class="rounded-full bg-indigo-500/20 px-2 py-0.5 text-indigo-200">
                    New
                  </span>
                  Reference is live
                  <span class="text-zinc-500">→</span>
                </a>

                <h1 class="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight">
                  <span class="text-indigo-200">vitrio-start</span>
                  <br />
                  SSR framework for Workers.
                </h1>

                <p class="mt-5 text-lg text-zinc-300">
                  vitrio-start は Cloudflare Workers 上で動く Bun-first / SSR-first のスターターです。
                  “server actions magic” を避けて、Plain HTTP + PRG（POST→Redirect→GET）でシンプルに作れます。
                </p>

                <div class="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="#quickstart"
                    class="inline-flex items-center rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 shadow hover:bg-white"
                  >
                    Quickstart
                  </a>
                  <a
                    href="/reference"
                    class="inline-flex items-center rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-950"
                  >
                    Reference
                  </a>
                </div>

                <div class="mt-6 text-xs text-zinc-500">
                  Rendered at{' '}
                  <span class="font-mono text-zinc-300">{String(homeData.now)}</span>
                </div>
              </div>

              <div id="quickstart" class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold">Quickstart</div>
                  <div class="text-xs text-zinc-500">bun + wrangler</div>
                </div>
                <pre class="mt-4 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-xs text-zinc-200">
                  <code>{`bun install\nbun run build\nbunx wrangler deploy`}</code>
                </pre>
                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <div class="text-xs font-semibold text-zinc-400">Runtime</div>
                    <div class="mt-1 text-sm font-semibold">Workers</div>
                  </div>
                  <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <div class="text-xs font-semibold text-zinc-400">Mode</div>
                    <div class="mt-1 text-sm font-semibold">SSR-first</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div class="text-sm font-semibold">Plain HTTP + PRG</div>
                <p class="mt-2 text-sm text-zinc-400">
                  POST は action を実行して 303 でリダイレクト。RPCっぽい魔法に寄せない。
                </p>
              </div>
              <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div class="text-sm font-semibold">CSRF + Flash built-in</div>
                <p class="mt-2 text-sm text-zinc-400">
                  cookie token + hidden input のCSRF。結果通知は1-shot flash cookie。
                </p>
              </div>
              <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div class="text-sm font-semibold">Small files, obvious flow</div>
                <p class="mt-2 text-sm text-zinc-400">
                  ルート定義はデータ。制御フローが読みやすく、AIにも優しい。
                </p>
              </div>
            </div>

            <div class="mt-16 flex items-center justify-between border-t border-zinc-900/80 py-8 text-xs text-zinc-500">
              <div>© {new Date().getUTCFullYear()} vitrio-start</div>
              <div class="flex items-center gap-3">
                <a class="hover:text-zinc-300" href="#quickstart">
                  Quickstart
                </a>
                <a class="hover:text-zinc-300" href="/reference">
                  Reference
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    },
  }),

  // --- Test/demo routes (used by bun test) ---
  defineRoute({
    path: '/counter',
    loader: () => ({ count: 0 }),
    action: async (_ctx, formData) => {
      const prev = Number(formData.get('count') ?? 0)
      const next = Number.isFinite(prev) ? prev + 1 : 1
      return { newCount: next }
    },
    component: ({ data, csrfToken }) => {
      const d = z.object({ count: z.number() }).parse(data)
      return (
        <div class="mx-auto max-w-xl px-6 py-16">
          <h1 class="text-2xl font-semibold">Counter</h1>
          <p class="mt-3 text-zinc-300">Tests use this page to verify CSRF/flash/security headers.</p>

          <form method="post" class="mt-6 flex items-center gap-3">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="count" value={String(d.count)} />
            <button class="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white">Increment</button>
            <span class="text-sm text-zinc-400">current: <span class="font-mono text-zinc-200">{String(d.count)}</span></span>
          </form>
        </div>
      )
    },
  }),

  defineRoute({
    path: '/redir',
    loader: async () => {
      const { redirect } = await import('./server/response')
      return redirect('/counter', 302)
    },
    component: () => <div />,
  }),

  defineRoute({
    path: '/gone',
    loader: async () => {
      const { notFound } = await import('./server/response')
      return notFound()
    },
    component: () => <div />,
  }),

  defineRoute({
    path: '/action-redirect',
    loader: () => ({}),
    action: async () => {
      const { redirect } = await import('./server/response')
      return redirect('/', 303)
    },
    component: ({ csrfToken }) => (
      <div class="mx-auto max-w-xl px-6 py-16">
        <h1 class="text-2xl font-semibold">Action Redirect</h1>
        <form method="post" class="mt-6">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <button class="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white">POST</button>
        </form>
      </div>
    ),
  }),

  // Reference (kept as docs in starter)
  defineRoute({
    path: '/reference',
    loader: () => ({ version: 'v1' }),
    component: () => {
      const html = HIGHLIGHT.routes_ts
      return (
        <div class="mx-auto max-w-3xl px-6 py-16">
          <h1 class="text-3xl font-semibold">Reference</h1>
          <div class="mt-6" dangerouslySetInnerHTML={{ __html: html } as any} />
        </div>
      )
    },
  }),
]
