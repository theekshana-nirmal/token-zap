---
name: token-zap-architecture
description: Architecture and codebase map of the token-zap npm package - directory layout, transform pipeline, zone-protection system, plugin system, zap template, public API, and coding conventions. Use whenever reading or modifying source files (index.ts, types.ts, zap.ts, utils/), changing the public API, or orienting in this repository before any code change.
---

# TokenZap Architecture

`@thee-nix/token-zap` (MIT) is a zero-runtime-dependency, ESM-only TypeScript library that shrinks LLM prompts deterministically: it strips extra spaces, invisible Unicode, and decorative separator lines, plus opt-in transforms (article removal, typography normalization). It is a pure text optimizer — not a tokenizer and not an AI service. Token counting is delegated to user-supplied tokenizer functions.

## Hard constraints

These define the project (restated from CONTRIBUTING.md / SECURITY.md). Never violate them:

- **Zero runtime dependencies.** `package.json` has no `dependencies` or `peerDependencies`. Never add a runtime dep, and never import Node/browser APIs (`fs`, `Buffer`, `process.env`): the code is pure string manipulation and implicitly isomorphic.
- **Pure, deterministic, synchronous.** Every module is stateless `string -> string` functions. No classes, no side effects, no async, no network calls, no data persistence.
- **ESM-only.** `"type": "module"`, no CJS build. All relative imports use explicit `.js` extensions (`./utils/removeArticles.js`) per NodeNext resolution.
- **No breaking changes to the public `tokenZap()` API** without prior discussion.

## Directory layout

Source lives at the repo ROOT — there is no `src/` directory. `tsc` (`rootDir: "."`) mirrors this layout into `dist/`, which is gitignored build output.

```
├── index.ts        # public entry: tokenZap() pipeline + re-exports
├── types.ts        # all public types
├── zap.ts          # zap tagged template literal
├── utils/          # one transform per file (9 modules)
├── test/           # vitest specs, one per feature (excluded from tsc build)
├── docs/           # one markdown guide per feature
├── dist/           # build output (gitignored)
└── .github/        # CODEOWNERS, issue/PR templates, ci.yml, publish.yml
```

`rename-audit.txt` at the root is a stale artifact from the v1.3.0 package rename (`@theenix` → `@thee-nix`); its contents no longer match the code — do not treat it as current.

## Module map

| File | Role |
|---|---|
| `index.ts` | `tokenZap()` facade; assembles the fixed-order pipeline; re-exports all types + `zap` |
| `types.ts` | `TokenZapOptions`, `TokenZapResult`, `TokenZapStats`, `TokenZapPlugin` |
| `zap.ts` | `zap` tagged template + `zap.with(options)`; `ZapOptions = Omit<TokenZapOptions, "report">` |
| `utils/extractZones.ts` | Core abstraction: splits text into ordered protected/prose `Zone[]` segments |
| `utils/sanitizeUnicode.ts` | Removes 9 invisible/zero-width code points, NBSP → space, NFC normalize (always safe, default on) |
| `utils/normalizeTypography.ts` | Opt-in: smart quotes/em-dashes/ellipsis → ASCII |
| `utils/removeArticles.ts` | Opt-in: zone-aware removal of `\b(a\|an\|the)\b` |
| `utils/stripDecorative.ts` | Removes separator lines (`^[ \t]*([-=*_~+#])\1{2,}[ \t]*$`) + blank-line collapse |
| `utils/trimExtraSpaces.ts` | Collapses space runs, strips trailing whitespace, collapses blank lines, trims the document |
| `utils/collapseBlankLines.ts` | Shared helper: `\n{3,}` → `\n\n` |
| `utils/runPlugins.ts` | Composes plugins with `reduce` |
| `utils/tokenCount.ts` | Tokenizer delegation; throws an actionable error when `tokenizer` is missing |

## Transform pipeline

`tokenZap()` in `index.ts` runs a fixed order. Order is deliberate — sanitize first so later transforms see clean input; plugins last:

1. `sanitizeUnicode` (default `true` — always safe)
2. `normalizeTypography` (default `false` — changes visual style)
3. `removeArticles` (default `false`)
4. `stripDecorative` (default `true`)
5. `trimExtraSpaces` (default `true`)
6. `plugins` (in array order, always last)

Defaults are applied by destructuring in the options parameter. `preserveCodeBlocks` (default `true`) is not a pipeline stage — it is passed through to zone-aware transforms; `false` makes each one fall back to its plain destructive regex path.

With `report: true`, `countTokens` runs before and after the pipeline and the function returns `{ output, stats: { originalTokens, cleanedTokens, tokensSaved, percentSaved } }` (`percentSaved` rounded to 2 decimals). TypeScript function overloads make the return type depend on the `report` literal. Reporting requires a user-supplied `tokenizer`; `utils/tokenCount.ts` otherwise throws an error recommending `gpt-tokenizer`, `@anthropic-ai/tokenizer`, `llama3-tokenizer-js`, or `@mistralai/tokenizer-js`.

## Zone protection (the key pattern)

`utils/extractZones.ts` is the central abstraction. It scans for the earliest of three matchers — fenced code blocks (triple-backtick or `~~~` fences, with a backreference keeping opening/closing fence chars consistent), markdown tables (consecutive lines starting with `|`), and inline code — and emits an ordered `Zone[]` of `{ content, protected }` segments.

Two consumer patterns exist. Reuse one of them rather than inventing a third:

- **Placeholder masking** (used by `stripDecorative`, `trimExtraSpaces`): replace each protected zone with a `\u0000N\u0000` token, run the destructive regex on the whole string, then restore. Needed when the regex can't be applied per-segment.
- **Zone-by-zone mapping** (used by `removeArticles`): apply the transform to unprotected segments only and rejoin.

Boundary rule (fixed in v1.2.0): fenced-block and table zones exclude their trailing newline so it stays with the prose zone — preserve this when touching `extractZones`.

## Plugin system and `zap`

- A plugin is `type TokenZapPlugin = (text: string) => string`. Plugins run after all built-in transforms, are intentionally NOT zone-aware (protected code is already restored by then — this keeps the contract a plain `string -> string`), and their output is included in report stats. Keep this contract a plain function.
- `zap` is a tagged template that cleans ONLY interpolated values, leaving static template text byte-exact. `stringifyValue` rules: `null`/`undefined` → `""` (avoids leaking literal "null" into prompts), primitives via `String()`, objects via `JSON.stringify` with a `try/catch` fallback to `String()` (circular refs). `zap.with(options)` returns a configured variant; the callable-with-method shape is built with `Object.assign`. `zap.ts` imports `tokenZap` from `index.js` — a circular-looking but benign ESM import.

## Coding conventions

- Named exports only; camelCase functions, PascalCase types; no default exports anywhere
- Functional style: no classes, no state, no side effects
- JSDoc on essentially every function, with rationale comments (e.g. "OPT-IN (default: false) because…", "This transform is ALWAYS SAFE") and regex explanations
- Errors: plain `throw new Error(...)` with actionable, verbose messages; no custom error classes
- Fully synchronous; no dynamic `import()`
- Options via destructured defaults; boolean feature flags

For the change workflow, commands, and testing conventions, read the `token-zap-development` skill.
