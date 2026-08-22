# Changelog

## [1.7.0]

### Added

- **Command-Line Interface (#16)** - Batch file processing and diagnostics without writing custom scripts
  - New `token-zap` binary (`npx @thee-nix/token-zap <file>`) prints cleaned output to stdout; warnings and stats go to stderr so stdout stays pipeable
  - Multiple files and `*`/`?` wildcard patterns in one invocation (recursive `**` not supported)
  - `--stats` prints per-file and total token savings (approximate, ~4 chars/token — the package stays zero-dependency)
  - `--config <path>` loads cleaning options from a JSON file for consistent project-wide settings
  - Exit codes for CI pipelines: 0 success, 1 file error, 2 usage/config error
  - Binary blob warnings are surfaced on stderr by default
  - Thin wrapper around the `tokenZap()` core API; no transformation logic duplicated, no new dependencies
  - Documentation in `docs/cli.md`
- **Binary Blob Detection (#10)** - Detect accidentally pasted base64/binary data blobs in prompt text
  - With `report: true`, `TokenZapResult` now includes a `warnings: string[]` array listing each detected blob (character count and position) without modifying the text — detect-and-warn by default
  - New opt-in `stripBinaryBlobs` option replaces detected blobs with a `[binary data removed, n characters]` placeholder
  - Heuristic: bare base64-alphabet runs of 100+ characters with mixed case and digits, plus explicit `data:<mime>;base64,` URIs with 50+ character payloads — UUIDs, SHA-256, and long single-case hex strings are not flagged
  - Zone-aware: blobs inside code blocks, inline code, and tables are treated as intentional and skipped when `preserveCodeBlocks` is `true`
  - Documentation in `docs/binary-blob-detection.md`

## [1.6.0] - 2026-08-20

### Added

- **Zap Tagged Template Literal (#43)** - Inline prompt construction without manually wrapping every interpolated value
  - New exported `zap` tagged template function: `` zap`Analyze this: ${value}` `` optimizes only interpolated values, leaving static template text untouched
  - `zap.with(options)` returns a configured tagged template function for non-default options
  - Non-string interpolated values are stringified before cleaning: `null`/`undefined` become empty strings, primitives use `String(value)`, objects/arrays use `JSON.stringify(value)` with a `String(value)` fallback for non-serializable values
  - New exported type: `ZapOptions`
  - Documentation in `docs/zap-template.md`

## [1.5.0] - 2026-08-18

### Added

- **Plugin System (#15)** - Add custom text-cleaning rules without forking TokenZap
  - New `plugins: []` option on `tokenZap()` accepts an array of `(text: string) => string` functions
  - Plugins run last in the pipeline, after all built-in transforms, receiving the fully cleaned text
  - Plugins are not zone-aware: protected zones (code blocks, tables) are already restored by the time plugins run (documented caveat)
  - New exported type: `TokenZapPlugin`
  - Comprehensive documentation in `docs/plugins.md`

### Changed

- `TokenZapOptions` interface now includes `plugins?: TokenZapPlugin[]`

# Changelog

## [1.4.0] - 2026-08-16

### Added

- **Token Analytics (#5)** - Real token counting with `report: true` option
  - Returns `{ output, stats }` with `originalTokens`, `cleanedTokens`, `tokensSaved`, `percentSaved`
  - User-provided tokenizer function via `tokenizer` option (works with any LLM provider)
  - Comprehensive documentation in `docs/token-analytics.md`
- TypeScript function overloads for type-safe `report` option
- New exported types: `TokenZapResult`, `TokenZapStats`

### Changed

- `TokenZapOptions` interface now includes `report?: boolean` and `tokenizer?: (text: string) => number`

---

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-08-15

### BREAKING CHANGE

- **Package renamed from `@theenix/token-zap` to `@thee-nix/token-zap`**. The scope now matches the maintainer's npm username exactly. The old package name remains published at v1.2.0 with a deprecation notice but will not receive further updates.

  Update your import:

  ```diff
  - import { tokenZap } from "@theenix/token-zap";
  + import { tokenZap } from "@thee-nix/token-zap";
  ```

  Update your install command:

  ```diff
  - npm install @theenix/token-zap
  + npm install @thee-nix/token-zap
  ```

### Added

- **Unicode sanitization (default: enabled)** - Removes invisible characters (zero-width spaces, BOM, non-breaking spaces, soft hyphens, direction marks) and applies NFC normalization. This is always safe and reduces hidden token waste (#7)
- **Typography normalization (opt-in)** - Converts smart quotes, em dashes, en dashes, and ellipsis to plain ASCII equivalents. Disabled by default because it changes visual style (#7)
- `docs/unicode-sanitization.md` - complete guide to Unicode sanitization and typography normalization
- `docs/options.md` - comprehensive options reference covering all transforms
- `docs/examples.md` - usage examples for all features
- `utils/sanitizeUnicode.ts` - removes invisible Unicode characters and applies NFC normalization
- `utils/normalizeTypography.ts` - converts smart quotes and typographic characters to ASCII

### Changed

- **Test suite reorganized** - Split monolithic test file into 6 focused files (`trimExtraSpaces.spec.ts`, `preserveCodeBlocks.spec.ts`, `removeArticles.spec.ts`, `stripDecorative.spec.ts`, `sanitizeUnicode.spec.ts`, `normalizeTypography.spec.ts`) for better maintainability
- **README restructured** - Condensed to compact overview with links to detailed documentation in `docs/`
- Pipeline now runs `sanitizeUnicode` first (before all other transforms) to ensure clean input for subsequent processing

## [1.2.0] - 2026-08-15

### Added

- `stripDecorative` option (default: `true`) - removes decorative separator lines (repeated `-`, `=`, `*`, `_`, `~`, `+`, `#`) and collapses 3+ blank lines into one (#11)
- `docs/strip-decorative.md` - detailed before/after examples and edge case reference for `stripDecorative`
- `utils/collapseBlankLines.ts` - shared blank-line collapsing helper, extracted from `trimExtraSpaces` for reuse across transforms

### Changed

- Migrated test suite from a custom assertion runner to Vitest for better isolation, reporting, and scalability as test count grows
- `trimExtraSpaces` now delegates blank-line collapsing to the shared `collapseBlankLines` helper (no behavior change)

### Fixed

- `extractZones` no longer absorbs the trailing newline after a fenced code block's closing fence or a table's final row into the protected zone content. This boundary bug was latent in v1.1.0 but did not surface until line-splitting transforms (`stripDecorative`) were introduced, since prior transforms did not rely on exact line boundaries at zone edges.

## [1.1.0] - 2026-08-04

### Added

- TypeScript migration - full type safety, ships `.d.ts` declarations (#19)
- `preserveCodeBlocks` option (default: `true`) - protects fenced code blocks, inline code, and markdown tables from all transforms (#4)
- `extractZones` internal module - detects and segments protected zones for use across all transforms (#4)
- Zone-aware `removeArticles` - articles inside code blocks and tables are now preserved (#20)
- `.gitignore` covering `node_modules/`, `dist/`, and temp files
- Build pipeline: `npm run build` compiles TypeScript to `dist/`

### Changed

- `trimExtraSpaces` now preserves newlines instead of collapsing all whitespace to a single line (#4)
- `trimExtraSpaces` uses zone-masking so line-boundary logic works correctly across the full document (#4)
- README restructured with options table, TypeScript examples, and contributing guide

### Fixed

- `trimExtraSpaces` no longer corrupts indentation inside code blocks (#4)
- `removeArticles` no longer strips articles from variable names and comments inside code (#20)

## [1.0.1] - 2026-06-04

### Fixed

- Minor packaging fixes

## [1.0.0] - 2026-06-01

### Added

- Initial release
- `trimExtraSpaces` option
- `removeArticles` option

