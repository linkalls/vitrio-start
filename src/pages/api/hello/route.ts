/**
 * API route: GET /api/hello
 *
 * Example of a file-based API route in vitrio-start.
 * Place a route.ts alongside any page to create a JSON API endpoint.
 * Export named functions for each HTTP method you want to handle.
 */
export async function GET(_request: Request): Promise<Response> {
  return Response.json({
    message: 'Hello from vitrio-start!',
    timestamp: Date.now(),
    framework: 'vitrio-start',
    docs: 'https://github.com/linkalls/vitrio-start',
  })
}
