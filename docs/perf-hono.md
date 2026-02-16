# Hono performance notes

This repo is framework-agnostic, but we benchmark Hono too since it's a common choice.

## What we benchmark

Hono does not expose a stable public API for “router.match() only”.
So we benchmark the realistic thing we actually do:

- `await app.fetch(request)` dispatch for GET routes.

This includes:

- request parsing
- context creation
- router matching
- handler invocation

So it is **not** directly comparable to a pure `matchPath()` micro-benchmark.

## Run

```bash
bun run bench:hono
```

The script prints:

- `matchCompiled` (pure sync matcher)
- `hono.fetch` dispatch throughput

Use it as a regression guard on your machine.
