/**
 * Root layout — automatically wraps all file-based pages (src/pages/).
 * Provides a consistent site header and navigation.
 *
 * This layout is only applied to file-based routes; manual routes in
 * src/routes.manual.tsx manage their own layout.
 */
export default function RootLayout({ children }: { children: any }) {
  return (
    <div class="mx-auto max-w-6xl px-6 py-10">
      <header class="mb-10 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-950">
            V
          </span>
          <span class="text-sm font-semibold tracking-tight text-zinc-100">vitrio-start</span>
        </a>
        <nav class="flex items-center gap-3">
          <a href="/about" class="rounded-xl border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900">
            About
          </a>
          <a href="/reference" class="rounded-xl border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900">
            Reference
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
