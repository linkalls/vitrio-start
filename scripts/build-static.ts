import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

/**
 * Experimental SSG (Static Site Generator) Builder
 *
 * Pre-renders all non-parameterized routes into pure static HTML files
 * in the `dist/static` directory. This is perfect for Astro-like use cases
 * where you want the absolute fastest Time-To-First-Byte for content pages.
 */

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'dist', 'static')

async function buildStatic() {
  console.log('🏗️  Building static routes...')

  // Make sure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true })
  }

  // Filter routes: we only statically render pages without dynamic parameters (no ':' or '*')
  const staticRoutes = compiledRoutes.filter((r) => {
    return !r.path.includes(':') && !r.path.includes('*')
  })

  let successCount = 0

  for (const route of staticRoutes) {
    const urlStr = `http://localhost${route.path === '/' ? '' : route.path}`
    const req = new Request(urlStr, { method: 'GET' })

    try {
      const res = await handleDocumentRequest(req, compiledRoutes, {
        title: 'vitrio-start (Static)',
        entrySrc: '/src/client/entry.tsx',
      })

      if (res.status === 200) {
        const html = await res.text()

        // Determine file path: `/about` -> `dist/static/about/index.html`
        let relativeOutPath = route.path === '/' ? 'index.html' : `${route.path}/index.html`
        // Strip leading slash if present
        if (relativeOutPath.startsWith('/')) {
          relativeOutPath = relativeOutPath.slice(1)
        }

        const outPath = join(OUT_DIR, relativeOutPath)
        const outDir = dirname(outPath)

        if (!existsSync(outDir)) {
          mkdirSync(outDir, { recursive: true })
        }

        writeFileSync(outPath, html, 'utf-8')
        console.log(`✅ Pre-rendered: ${route.path} -> dist/static/${relativeOutPath}`)
        successCount++
      } else {
        console.warn(`⚠️ Skipped ${route.path} (Status: ${res.status})`)
      }
    } catch (err) {
      console.error(`❌ Failed to render ${route.path}:`, err)
    }
  }

  console.log(`\n🎉 SSG Build complete. Pre-rendered ${successCount} pages to dist/static.`)
}

buildStatic().catch((err) => {
  console.error('Build failed', err)
  process.exit(1)
})
