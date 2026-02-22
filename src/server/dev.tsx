import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { handleApiRoutes } from './mount-api-routes'
import { config } from './config'

// Dev server: serve Vite source files directly (no bundling)
const DEV_STATIC_PREFIXES = ['/src/', '/node_modules/', '/@vite/']

async function serveDevStatic(pathname: string): Promise<Response | null> {
  const file = Bun.file('.' + pathname)
  if (await file.exists()) {
    return new Response(file)
  }
  return null
}

async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Serve dev source files directly
  if (DEV_STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const res = await serveDevStatic(pathname)
    if (res) return res
  }

  // File-based API routes (from src/pages/**/route.ts)
  const apiResponse = await handleApiRoutes(request, fsApiRoutes)
  if (apiResponse) return apiResponse

  // Document request (SSR)
  return handleDocumentRequest(request, compiledRoutes, {
    title: 'vitrio-start (dev)',
    entrySrc: '/src/client/entry.tsx',
  })
}

console.log('dev listening on', config.port)
Bun.serve({ port: config.port, fetch })
