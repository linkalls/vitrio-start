# Testing Guide

This document explains how testing works in vitrio-start and how to add new tests.

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/prg-csrf.spec.ts

# Run tests with watch mode
bun test --watch
```

## Test Structure

Tests are located in the `tests/` directory and use Bun's built-in test runner.

### Existing Tests

- `prg-csrf.spec.ts` - PRG pattern and CSRF protection
- `action-params.spec.tsx` - Action parameter handling
- `action-redirect.spec.tsx` - Action redirects
- `http-status.spec.ts` - HTTP status codes
- `loader-error.spec.tsx` - Loader error handling
- `loader-redirect.spec.ts` - Loader redirects
- `security-headers.spec.ts` - Security headers
- `ssr-prime.spec.tsx` - SSR loader priming
- `ssr-prime-nested.spec.tsx` - Nested route loader priming
- `url-normalize.spec.tsx` - URL normalization

## Writing Tests

### Basic Test Structure

```tsx
import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('description of what you are testing', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/your-path')
  
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toContain('expected content')
})
```

### Testing Loaders

```tsx
test('loader returns data correctly', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/your-route')
  
  expect(res.status).toBe(200)
  const html = await res.text()
  
  // Check that loader data is in the cache
  expect(html).toContain('__VITRIO_LOADER_CACHE__')
  
  // Extract and check the cache
  const match = html.match(/globalThis\.__VITRIO_LOADER_CACHE__ = ({.*?});/)
  expect(match).toBeTruthy()
  
  const cache = JSON.parse(match![1])
  expect(cache).toBeTruthy()
})
```

### Testing Actions (POST)

```tsx
test('action processes form data', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  // 1. GET to obtain CSRF token
  const res1 = await app.request('http://local.test/your-route')
  const setCookies = getSetCookies(res1)
  const csrf = findCookie(setCookies, 'vitrio_csrf')
  
  // 2. POST with CSRF token
  const fd = new FormData()
  fd.set('_csrf', csrf!)
  fd.set('field', 'value')

  const res2 = await app.request('http://local.test/your-route', {
    method: 'POST',
    body: fd,
    headers: {
      cookie: `vitrio_csrf=${csrf}`,
    },
  })

  // 3. Check redirect (PRG)
  expect(res2.status).toBe(303)
  expect(res2.headers.get('location')).toBe('/expected-redirect')
  
  // 4. Check flash cookie
  const flash = findCookie(getSetCookies(res2), 'vitrio_flash')
  expect(flash).toContain('"ok":true')
})
```

### Testing Redirects

```tsx
test('loader redirects to another page', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/redirect-route')
  
  expect(res.status).toBe(302) // or 303 for actions
  expect(res.headers.get('location')).toBe('/target-route')
})
```

### Testing 404s

```tsx
test('returns 404 for non-existent route', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/does-not-exist')
  
  expect(res.status).toBe(404)
  const html = await res.text()
  expect(html).toContain('404')
})
```

## Helper Functions

These helpers are useful for testing cookies (copy to your test file):

```tsx
function getSetCookies(res: Response): string[] {
  const raw = res.headers.get('set-cookie')
  if (!raw) return []
  return raw.split(/,(?=[^;]+?=)/g).map((s) => s.trim())
}

function findCookie(setCookies: string[], name: string): string | null {
  const hit = setCookies.find((c) => c.startsWith(name + '='))
  if (!hit) return null
  const raw = hit.split(';')[0].slice((name + '=').length)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
```

## Testing Best Practices

1. **Test the happy path first** - Make sure the basic functionality works
2. **Test error cases** - What happens when validation fails, CSRF is missing, etc.
3. **Test security features** - CSRF, security headers, etc.
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - Make it clear what each test validates

## CI/CD

Tests run automatically on:
- Every push to `main` branch
- Every pull request to `main` branch

The CI workflow:
1. Checks out code
2. Installs Bun
3. Installs dependencies (with caching)
4. Runs typecheck
5. Runs tests

See `.github/workflows/ci.yml` for the full configuration.

## Debugging Tests

### View test output in detail

```bash
bun test --verbose
```

### Run a single test

```bash
bun test tests/your-test.spec.ts
```

### Add console.log in tests

```tsx
test('debug something', async () => {
  const res = await app.request('http://local.test/path')
  console.log('Response:', await res.text())
  expect(res.status).toBe(200)
})
```

## Performance Testing

Run benchmarks:

```bash
# Route matching benchmark
bun run bench:match

# Hono server benchmark
bun run bench:hono
```

See `docs/perf.md` for more details.

## Coverage (Optional)

Bun doesn't have built-in coverage yet, but you can use external tools if needed.

For now, we rely on comprehensive manual testing of:
- All route patterns
- All loader scenarios (data, redirect, notFound)
- All action scenarios (success, redirect, validation errors)
- Security features (CSRF, headers)
- Error handling (404, 500)

## Summary

- Tests are in `tests/` directory
- Use `bun test` to run tests
- Follow existing test patterns
- Test loaders, actions, redirects, and errors
- CI runs tests automatically on every PR
