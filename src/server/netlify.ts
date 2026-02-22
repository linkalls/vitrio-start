import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { handleApiRoutes } from './mount-api-routes'

// Netlify Functions entry (Web-standard Request/Response format).
// Bundle this file to netlify/functions/server and deploy via Netlify UI/CLI.

export default async (request: Request): Promise<Response> => {
  // File-based API routes (from src/pages/**/route.ts)
  const apiResponse = await handleApiRoutes(request, fsApiRoutes)
  if (apiResponse) return apiResponse

  // Document request (SSR)
  return handleDocumentRequest(request, compiledRoutes, {
    title: 'vitrio-start',
    // In Netlify, serve built assets via Netlify static hosting.
    entrySrc: '/assets/entry.js',
  })
}

export const config = { path: '/*' }
