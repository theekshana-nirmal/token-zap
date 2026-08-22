# CLI Guide

TokenZap v1.7.0+ ships a command-line interface for cleaning prompt files, auditing existing prompt libraries, and integrating optimization into build or CI pipelines — no custom scripts required.

The CLI is a thin wrapper around the same `tokenZap()` core API the library exposes; no transformation logic is duplicated.

## Installation

The `token-zap` binary is included with the package:

```bash
npx @thee-nix/token-zap prompt.txt
```

Or, after installing the package (`npm install @thee-nix/token-zap`), run `npx token-zap` or use the binary directly from `node_modules/.bin`.

## Quick Start

```bash
$ npx @thee-nix/token-zap prompt.txt
Hello world
```

The cleaned text is printed to stdout. Diagnostics — warnings and stats — go to stderr, so stdout always stays pipeable:

```bash
npx @thee-nix/token-zap prompt.txt > cleaned.txt
```

## Usage

```
Usage: token-zap [options] <file|pattern> [more files/patterns...]

Options:
  --stats          Print token savings to stderr (approximate, ~4 chars/token)
  --config <path>  Load cleaning options from a JSON file
  --help           Show this help
  --version        Print the package version
```

### Multiple files and globs

Pass several files or patterns in one invocation. Patterns support `*` and `?` wildcards in the file-name part (for example `prompts/*.txt`); recursive `**` patterns are not supported. Files are processed in argument order; overlapping patterns are deduplicated. Each file's cleaned output is printed to stdout followed by a newline.

```bash
npx @thee-nix/token-zap prompts/*.txt
```

### `--stats`

Prints per-file token savings to stderr, plus a `total:` line when more than one file is processed:

```
prompt.txt: 4 -> 3 tokens (approximate; saved 1, 25%)
```

Token counts are **approximate** (~4 characters per token). TokenZap is zero-dependency and token counting is delegated to user-supplied tokenizers in the library API; for exact counts, use `tokenZap()` with `report: true` and a real tokenizer (see [token-analytics.md](token-analytics.md)).

### `--config <path>`

Loads cleaning options from a JSON file so a project can share one set of settings:

```json
{
  "removeArticles": true,
  "stripBinaryBlobs": true,
  "normalizeTypography": true
}
```

- Allowed keys: `removeArticles`, `trimExtraSpaces`, `preserveCodeBlocks`, `stripDecorative`, `sanitizeUnicode`, `normalizeTypography`, `stripBinaryBlobs` — all boolean.
- `report`, `tokenizer`, and `plugins` are rejected: they only make sense programmatically.
- An unreadable file, invalid JSON, a non-object root, an unknown key, or a non-boolean value is a config error (exit code 2).

### Warnings

Binary blob detection (see [binary-blob-detection.md](binary-blob-detection.md)) is always active in the CLI. Detected blobs are reported on stderr, prefixed with the file path, without modifying the output:

```
prompt.txt: Possible base64 or binary data blob detected (4821 characters at index 14).
```

To actually replace blobs with a placeholder, enable `stripBinaryBlobs` via a `--config` file.

## Exit codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| `0`   | Success — all files processed                        |
| `1`   | File error — an input file is missing or unreadable  |
| `2`   | Usage or config error — bad flags, bad `--config`    |

These make the CLI safe for CI pipelines: a non-zero exit fails the step while keeping the failure reason on stderr.

## CI pipeline example

```yaml
- name: Clean prompts
  run: |
    npx @thee-nix/token-zap --config tokenzap.config.json prompts/*.txt > cleaned/
```

## Implementation notes

- The CLI adds no dependencies: argument parsing uses `node:util` `parseArgs`, and glob expansion is a small built-in wildcard matcher.
- `cli.ts` is the only module in the package that imports Node builtins; the library core stays pure, isomorphic string manipulation.
