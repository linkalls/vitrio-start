import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { handleApiRoutes } from './mount-api-routes'
import { config } from './config'

// Production server: serve built assets from dist/client
async function serveStaticAsset(pathname: string): Promise<Response | null> {
  const file = Bun.file('./dist/client' + pathname)
  if (await file.exists()) {
    const headers = new Headers({ 'Cache-Control': 'public, max-age=31536000, immutable' })
    return new Response(file, { headers })
  }
  return null
}

async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Static client assets (after `bun run build`)
  // Serve with immutable cache headers for hashed assets
  if (pathname.startsWith('/assets/')) {
    const res = await serveStaticAsset(pathname)
    if (res) return res
    return new Response('Not Found', { status: 404 })
  }

  // File-based API routes (from src/pages/**/route.ts)
  const apiResponse = await handleApiRoutes(request, fsApiRoutes)
  if (apiResponse) return apiResponse

  // Document request (SSR)
  return handleDocumentRequest(request, compiledRoutes, {
    title: 'vitrio-start',
    entrySrc: '/src/client/entry.tsx',
  })
}

export default { port: config.port, fetch }
