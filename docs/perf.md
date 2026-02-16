# Performance notes

This repo aims to stay simple, but we still measure hot-paths.

## Route matching micro-benchmark

Command:

```bash
bun run bench:match
```

This benchmarks:

- `matchPath(pattern, path)` (splits the pattern on every call)
- `matchCompiled(compiledPattern, path)` (pattern is pre-split once)

Example result (on the author machine):

- `matchPath`: ~1048ms / 1,000,000 iterations
- `matchCompiled`: ~717ms / 1,000,000 iterations

So pre-compiling patterns was ~1.4–1.5x faster for this workload.

> Note: absolute numbers vary by CPU/runtime. We care about the relative trend.
