import type { LoaderCtx, ActionApi } from '@potetotown/vitrio'
import { z } from 'zod'
import { compilePath, type CompiledPath } from './server/match'
import { HIGHLIGHT } from './server/highlight'

export interface RouteDef {
  path: string
  /**
   * Enable client-side JS for this route ("use client"-style).
   * Default is SSR-only: fully usable without JS.
   */
  client?: boolean
  loader?: (ctx: LoaderCtx) => Promise<unknown> | unknown
  action?: (ctx: LoaderCtx, formData: FormData) => Promise<unknown> | unknown
  component: (props: {
    data: unknown
    action: ActionApi<FormData, unknown>
    csrfToken: string
  }) => unknown
}

export type CompiledRouteDef = RouteDef & { _compiled: CompiledPath }

export function defineRoute(route: RouteDef): RouteDef {
  return route
}

export const routes = [
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
      // Loader redirect test
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

  defineRoute({
    path: '/docs',
    loader: () => ({}),
    component: () => {
      return (
        <div class="bg-grid">
          <div class="mx-auto max-w-3xl px-6 py-16">
            <a href="/" class="text-sm text-zinc-300 hover:text-zinc-100">← Back to Home</a>
            <h1 class="mt-8 text-3xl font-semibold tracking-tight">Moved</h1>
            <p class="mt-3 text-zinc-300">
              vitrio-start は 1ページのホームに統合しました。
              Quickstart は <span class="font-mono">/#quickstart</span>、Reference は <span class="font-mono">/reference</span> です。
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="/#quickstart" class="rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">Open Quickstart</a>
              <a href="/reference" class="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-950">Open Reference</a>
            </div>
          </div>
        </div>
      )
    },
  }),

  defineRoute({
    path: '/docs/getting-started',
    loader: () => ({}),
    component: () => {
      return (
        <div class="bg-grid">
          <div class="mx-auto max-w-3xl px-6 py-16">
            <a href="/" class="text-sm text-zinc-300 hover:text-zinc-100">← Back to Home</a>
            <h1 class="mt-8 text-3xl font-semibold tracking-tight">Moved</h1>
            <p class="mt-3 text-zinc-300">
              Getting Started はホームの Quickstart に統合しました。
              <span class="font-mono">/#quickstart</span> を見てください。
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="/#quickstart" class="rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">Open Quickstart</a>
              <a href="/reference" class="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-950">Open Reference</a>
            </div>
          </div>
        </div>
      )
    },
  }),

  defineRoute({
    path: '/docs/why',
    loader: () => ({}),
    component: () => {
      return (
        <div class="bg-grid">
          <div class="mx-auto max-w-3xl px-6 py-16">
            <a href="/" class="text-sm text-zinc-300 hover:text-zinc-100">← Back to Home</a>
            <h1 class="mt-8 text-3xl font-semibold tracking-tight">Moved</h1>
            <p class="mt-3 text-zinc-300">
              Why は Reference に統合しました。
              <span class="font-mono">/reference</span> を見てください。
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="/reference" class="rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">Open Reference</a>
              <a href="/#quickstart" class="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-950">Open Quickstart</a>
            </div>
          </div>
        </div>
      )
    },
  }),

  defineRoute({
    path: '/reference',
    client: true,
    loader: () => ({ version: 'v1' }),
    component: ({ data }) => {
      const d = z.object({ version: z.string() }).parse(data)
      return (
        <div class="bg-grid">
          <div class="mx-auto max-w-7xl px-6 py-12">
            <div class="flex items-center justify-between">
              <a href="/" class="flex items-center gap-2">
                <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-950">V</span>
                <span class="text-sm font-semibold tracking-tight text-zinc-100">vitrio-start</span>
              </a>
              <a href="/" class="text-sm text-zinc-300 hover:text-zinc-100">← Back</a>
            </div>

            <div class="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
              {/* Mobile: collapsible table of contents (no JS required) */}
              <details class="lg:hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
                <summary class="cursor-pointer select-none text-sm font-semibold text-zinc-100">
                  On this page
                  <span class="ml-2 text-xs font-normal text-zinc-400">(tap to expand)</span>
                </summary>
                <nav class="mt-4 grid gap-1 text-sm">
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#overview">Overview</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#routes">Routes</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#request-flow">Request flow (PRG)</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#csrf-flash">CSRF / Flash</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#security-headers">Security headers</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#routing-contracts">Routing contracts</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#workers">Workers deployment</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#dev">Dev / Build</a>
                  <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#underlying">Underlying UI</a>
                </nav>
              </details>

              {/* Desktop: sticky sidebar */}
              <aside class="hidden lg:block lg:sticky lg:top-8 lg:self-start">
                <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
                  <div class="text-xs font-semibold uppercase tracking-wider text-zinc-400">On this page</div>
                  <nav class="mt-4 grid gap-1 text-sm">
                    <a data-toc-link class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#overview">Overview</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#routes">Routes</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#request-flow">Request flow (PRG)</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#csrf-flash">CSRF / Flash</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#security-headers">Security headers</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#routing-contracts">Routing contracts</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#workers">Workers deployment</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#dev">Dev / Build</a>
                    <a class="rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-950/60" href="#underlying">Underlying UI</a>
                  </nav>
                </div>
              </aside>

              <main class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
                <div class="flex items-start justify-between gap-6">
                  <div>
                    <div class="text-sm font-medium text-zinc-400">Reference</div>
                    <h1 class="mt-2 text-3xl font-semibold tracking-tight">vitrio-start ({d.version})</h1>
                    <p class="mt-3 text-zinc-300">
                      Bun-first / SSR-first のスターター。Plain HTTP + PRG（POST→Redirect→GET）で、
                      ルーティング・フォーム・最低限のセキュリティを “小さいコード” でまとめます。
                    </p>
                  </div>
                  <a href="/#quickstart" class="shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-950">Quickstart</a>
                </div>

                {(() => {
                  const CodeBlock = (p: {
                    title: string
                    lang: string
                    htmlKey?: keyof typeof HIGHLIGHT
                    code: string
                  }) => {
                    const html = p.htmlKey ? HIGHLIGHT[p.htmlKey] : undefined

                    return (
                      <div class="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
                        <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-2">
                          <div class="text-xs font-semibold text-zinc-300">{p.title}</div>
                          <div class="flex items-center gap-3">
                            <button
                              type="button"
                              class="rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-950"
                              data-copy={p.code}
                              aria-label="Copy code"
                            >
                              Copy
                            </button>
                            <div class="text-[11px] text-zinc-500">{p.lang}</div>
                          </div>
                        </div>
                        {html ? (
                          <div class="overflow-x-auto p-0 text-[12px] leading-relaxed" innerHTML={html} />
                        ) : (
                          <pre class="overflow-x-auto p-4 text-[12px] leading-relaxed text-zinc-200"><code>{p.code}</code></pre>
                        )}
                      </div>
                    )
                  }

                  return (
                    <article class="mt-10 space-y-10
                      [\&_h2]:scroll-mt-24 [\&_h2]:text-xl [\&_h2]:font-semibold
                      [\&_p]:break-words [\&_p]:leading-7 [\&_p]:text-zinc-300
                      [\&_pre]:leading-relaxed
                      [\&_a]:text-indigo-200 [\&_a:hover]:text-indigo-100
                    ">
                  <section id="overview">
                    <h2 class="text-xl font-semibold">Overview</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      vitrio-start は “server actions をRPC化する魔法” を作りません。
                      代わりに <span class="font-mono text-zinc-200">action</span> を普通のHTTPとして扱い、結果は redirect で戻します。
                    </p>
                    <div class="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                      <div class="font-semibold text-zinc-200">Key ideas</div>
                      <ul class="mt-2 list-disc space-y-1 pl-5">
                        <li>Routes are data: <span class="font-mono">path / loader / action / component</span></li>
                        <li>POST is PRG (303 redirect)</li>
                        <li>CSRF + flash messages are cookie-based</li>
                      </ul>
                    </div>
                  </section>

                  <section id="routes">
                    <h2 class="text-xl font-semibold">Routes (src/routes.tsx)</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      ルートは配列で定義します。component は VNode を返し、SSR側が HTML にします。
                    </p>
                    <CodeBlock
                      title="routes.tsx"
                      lang="ts"
                      htmlKey="routes_ts"
                      code={`defineRoute({
  path: '/reference',
  loader: (ctx) => ({ /* ... */ }),
  action: (ctx, formData) => ({ /* ... */ }),
  component: ({ data, csrfToken }) => <Page />,
})`}
                    />
                  </section>

                  <section id="request-flow">
                    <h2 class="text-xl font-semibold">Request flow (src/server/framework.tsx)</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      POST は action を実行して 303 redirect。GET は loader を先に回してから SSR。
                      変な隠しRPCを作らないので、デバッグがシンプルです。
                    </p>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                      <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <div class="text-sm font-semibold">POST</div>
                        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                          <li>match action</li>
                          <li>verify CSRF</li>
                          <li>set flash cookie</li>
                          <li>303 redirect</li>
                        </ul>
                      </div>
                      <div class="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <div class="text-sm font-semibold">GET</div>
                        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                          <li>run loaders</li>
                          <li>prime loader cache</li>
                          <li>renderToStringAsync</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section id="csrf-flash">
                    <h2 class="text-xl font-semibold">CSRF / Flash</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      CSRF は <span class="font-mono text-zinc-200">vitrio_csrf</span> cookie を発行して、
                      フォームの <span class="font-mono text-zinc-200">_csrf</span> と照合します。
                      flash は <span class="font-mono text-zinc-200">vitrio_flash</span> cookie（1-shot）で結果表示。
                    </p>
                    <CodeBlock
                      title="form"
                      lang="html"
                      htmlKey="form_html"
                      code={`<form method="post">
  <input type="hidden" name="_csrf" value={csrfToken} />
  ...
</form>`}
                    />
                  </section>

                  <section id="security-headers">
                    <h2 class="text-xl font-semibold">Security headers</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      デフォルトで最低限のヘッダを付与します。
                      CSP はミニマルなので、プロダクトに合わせて締める前提です。
                    </p>
                    <CodeBlock
                      title="headers"
                      lang="text"
                      htmlKey="headers_text"
                      code={`X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`}
                    />
                  </section>

                  <section id="routing-contracts">
                    <h2 class="text-xl font-semibold">Routing contracts (behavior)</h2>
                    <div class="mt-3 space-y-2 text-zinc-300 leading-7">
                      <p>
                        ルートは prefix 的にマッチします（親→子）。
                        action は “より深い（leaf）” を優先して実行します。
                      </p>
                      <ul class="list-disc space-y-1 pl-5 text-sm text-zinc-400">
                        <li>params は parent → child でマージ</li>
                        <li>GET の loader は SSR前に実行してキャッシュをprime</li>
                        <li>末尾スラッシュは正規化（/foo/ → /foo）</li>
                      </ul>
                    </div>
                  </section>

                  <section id="workers">
                    <h2 class="text-xl font-semibold">Workers deployment</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      静的アセットは assets binding で配信し、それ以外は Worker が SSR を返します。
                      <span class="font-mono text-zinc-200">run_worker_first = true</span> が重要です。
                    </p>
                    <CodeBlock
                      title="wrangler.toml"
                      lang="toml"
                      htmlKey="wrangler_toml"
                      code={`[assets]
directory = "dist/client"
binding = "ASSETS"
run_worker_first = true`}
                    />
                  </section>

                  <section id="dev">
                    <h2 class="text-xl font-semibold">Dev / Build</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      dev は Vite のHMR、prod は <span class="font-mono text-zinc-200">dist/client/assets</span> に出力します。
                    </p>
                    <CodeBlock
                      title="commands"
                      lang="bash"
                      htmlKey="commands_bash"
                      code={`bun run dev
bun run build
bunx wrangler deploy`}
                    />
                  </section>

                  <section id="underlying">
                    <h2 class="text-xl font-semibold">Underlying UI</h2>
                    <p class="mt-3 text-zinc-300 leading-7">
                      UI は Vitrio（reactive TSX）で書きます。
                      vitrio-start は “SSR/運用の土台” を提供する側です。
                    </p>
                  </section>
                </article>
                  )
                })()}
              </main>
            </div>
          </div>
        </div>
      )
    },
  }),
]

export const compiledRoutes: CompiledRouteDef[] = routes.map((r) => ({
  ...r,
  _compiled: compilePath(r.path),
}))
