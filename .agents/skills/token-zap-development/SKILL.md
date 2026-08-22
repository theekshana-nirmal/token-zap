---
name: token-zap-development
description: Development and testing workflow for token-zap - build/test commands, the end-to-end checklist for adding transforms or options, zone-awareness patterns, and test conventions. Use when writing or modifying any code or tests in this repository, adding a feature or transform, fixing bugs, or running builds and tests.
---

# TokenZap Development

## Commands

npm is the only package manager (`package-lock.json`, lockfileVersion 3). Tooling is deliberately minimal: plain `tsc` for the build, Vitest for tests. There is no ESLint, Prettier, or coverage tooling configured — follow the existing code style manually.

```bash
npm install        # setup
npm run build      # tsc -> dist/ (must stay error-free)
npm test           # vitest run (all specs, single pass)
npm test:watch     # vitest watch mode
```

There is no vitest config file; Vitest auto-discovers `test/*.spec.ts`; run a single spec during iteration with `npx vitest run test/<name>.spec.ts`. The `test/` directory is excluded from the `tsc` build (tsconfig `exclude`), so spec files are only type-checked/run by Vitest. Also note: tsconfig `include` lists only `index.ts`, `types.ts`, and `utils/**/*.ts` — a new top-level source file (like `zap.ts`) compiles only because `index.ts` imports it. If you add a top-level source file, make sure it's reachable from `index.ts` or it will be silently left out of `dist/`. CI (`.github/workflows/ci.yml`, Node 22.x) runs exactly `npm ci` → `npm run build` → `npm test` — run build AND test locally before finishing any change.

## Adding a new transform or option

Follow the established pattern (see CONTRIBUTING.md):

1. **Create `utils/<name>.ts`** — one transform per file, a small pure function. Reuse existing utils (`extractZones`, `collapseBlankLines`) before writing new ones.
2. **Make it zone-aware** if it touches whitespace or structure — code blocks, inline code, and tables must survive the transform (see the pattern below).
3. **Add the option** to `TokenZapOptions` in `types.ts` as a boolean flag with a deliberate default: `true` only if the transform is always-safe (like `sanitizeUnicode`), `false` if it can change meaning (like `removeArticles`, `normalizeTypography`).
4. **Wire it into the pipeline** in `index.ts`: add the destructure default and the `if (option)` stage in the correct position. Order matters — sanitize first, destructive whitespace transforms late, plugins last. `preserveCodeBlocks: false` must fall back to the plain (non-zone) path.
5. **Create `test/<name>.spec.ts`** mirroring the utils filename (conventions below).
6. **Update docs and CHANGELOG** — see the `token-zap-docs-contribution` skill for exact locations.
7. **Run `npm run build && npm test`** and confirm everything passes.

## Zone-awareness

If a transform's regex could damage code blocks, inline code, or tables, it must be zone-aware. Copy an existing consumer rather than inventing a new mechanism: placeholder masking as in `stripDecorative` for whole-document regexes, zone-by-zone mapping as in `removeArticles` for per-segment transforms (both patterns explained in the `token-zap-architecture` skill). Accept `preserveCodeBlocks` as the second parameter, matching the existing transforms, and fall back to the plain destructive path (no zone extraction) when it's `false`.

## Testing conventions

- One spec file per feature/transform in `test/`, named after the utils module (`stripDecorative.ts` → `test/stripDecorative.spec.ts`).
- **Exact-output assertions are mandatory** (CONTRIBUTING.md rule): `expect(tokenZap(input)).toBe(expected)` with the full expected string written out as a multi-line template literal. Never use substring/`toContain`/snapshot assertions.
- Import the public API (`../index.js`) for behavioral tests. Unit-test a util directly (e.g. `../utils/runPlugins.js`) only when the behavior isn't reachable through `tokenZap()`.
- No mocks, no `vi.fn`, no snapshots — the functions are pure, so mocking is never needed.
- Cover the edge cases existing specs cover: empty string, the option disabled (e.g. `{ stripDecorative: false }`), zone protection (the transform must NOT alter fenced code, inline code, or tables), `preserveCodeBlocks: false`, mixed line endings (`\r\n`), and non-Latin scripts where relevant.
- Structure: `describe("<feature>")` blocks with `it()` cases named as behavior statements ("removes separator lines", "does not touch fenced code blocks").
- For report/analytics changes: test both overloads (string and `TokenZapResult` returns), custom tokenizer functions, and `percentSaved` rounding to 2 decimals.

## Things to avoid

- No new dependencies, no async, no classes, no side effects, no `process.env`/`fs`/browser globals — full constraint list in the `token-zap-architecture` skill.
- Don't export internals from `index.ts`: the public surface is `tokenZap`, `zap`, and the types `TokenZapOptions`, `TokenZapResult`, `TokenZapStats`, `TokenZapPlugin`, `ZapOptions`.
- Don't change pipeline order or option defaults without strong justification — behavior is locked in by exact-output tests and published SemVer.
- Don't commit or hand-edit `dist/` (gitignored build output) or the stale `rename-audit.txt`.
