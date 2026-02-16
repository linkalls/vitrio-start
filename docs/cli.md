# CLI (GitHub link)

This repo ships an experimental scaffold script:

- `scripts/create.ts`
- exposed as a package binary: `create-vitrio-start`

## Run via bunx (from GitHub)

```bash
bunx --package github:linkalls/vitrio-start create-vitrio-start my-app
```

Options:

- `--no-install`

```bash
bunx --package github:linkalls/vitrio-start create-vitrio-start my-app --no-install
```

## Notes

- This is the "C" approach (CLI lives inside the starter repo).
- Long term we may split it into a dedicated `create-vitrio-start` package.
