import { Hono } from 'hono'
import { handle } from 'hono/netlify'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'

// Netlify Functions entry.
// This runs as a Netlify function (Node runtime) via `hono/netlify` adapter.

const app = new Hono()

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start',
    // In Netlify, serve built assets via Netlify static hosting.
    // Point to your built client entry.
    entrySrc: '/assets/entry.js',
  }),
)

export const handler = handle(app)
