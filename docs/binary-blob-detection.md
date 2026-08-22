# Binary Blob Detection Guide

TokenZap v1.7.0+ can detect base64-encoded images, files, and other binary-looking data blobs that were accidentally pasted into prompt text. Blobs like these can silently consume thousands of tokens with content the model cannot meaningfully use.

Detection is **warn-only by default** — TokenZap never silently alters your content, because some prompts intentionally include encoded data. Replacing blobs with a placeholder is a separate, explicit opt-in.

## Overview

```ts
import { tokenZap } from "@thee-nix/token-zap";

const result = tokenZap(text, {
  report: true,
  tokenizer: (text) => Math.ceil(text.length / 4),
});

console.log(result.warnings);
// [
//   "Possible base64 or binary data blob detected (4821 characters at index 14)."
// ]
```

With `report: true`, `TokenZapResult.warnings` contains one entry per detected blob, in document order. The `warnings` array is always present when reporting is enabled — it is simply empty when nothing suspicious was found.

## Stripping blobs (opt-in)

Pass `stripBinaryBlobs: true` to replace each detected blob with a short placeholder that records how much was removed:

```ts
import { tokenZap } from "@thee-nix/token-zap";

const text = `Analyze this screenshot: data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...`;

tokenZap(text, { stripBinaryBlobs: true });
// "Analyze this screenshot: [binary data removed, 2318 characters]"
```

- **Default:** `false` — detection never modifies text unless you ask for it.
- **Safe to enable by default:** No. Some prompts legitimately include encoded data (e.g. vision-model inputs); stripping is a deliberate choice.

## Detection heuristic

TokenZap flags a substring as a blob when either rule matches:

1. **Bare base64 run:** a contiguous run of at least **100** base64-alphabet characters (`A-Z`, `a-z`, `0-9`, `+`, `/`, plus up to two trailing `=`) that contains **at least one lowercase letter, one uppercase letter, and one digit**.
2. **Data URI:** an explicit `data:<mime>;base64,<payload>` whose payload is at least **50** characters. The `;base64` marker is a strong signal, so data URIs use a lower threshold and no case-mix requirement.

### Why these thresholds

The length floor of 100 keeps common legitimate strings safely below detection: UUIDs (36 characters, and dashes break runs anyway), SHA-256 hex digests (64 characters), and typical API tokens. The mixed-case + digit requirement filters out long single-case strings that technically match the base64 alphabet, such as SHA-512 hex digests (128 lowercase hex characters).

### Known limitations and false-positive scenarios

- **Long encoded tokens are flagged on purpose.** A JWT or session token whose segments each exceed 100 mixed-case characters matches the bare-run rule. That is usually desirable in prompts, but be aware of it.
- **URL-safe base64** (using `-` and `_`) is not detected unless it also contains a `/+`-free run that still satisfies the charset rules — treat URL-safe-base64 detection as best-effort.
- **Legitimately intended encoded data** will be flagged (warn-only) and stripped (when opted in) even if you meant to include it — that is why stripping is opt-in and warnings are advisory.
- The heuristic is structural, not semantic: it cannot tell an image payload from an encryption key. Both are token waste in a prompt.

## Zone behavior

`stripBinaryBlobs` is zone-aware, following the same protected-zone rules as all other transforms:

- Blobs inside fenced code blocks, inline code, and markdown tables are treated as **intentional** and are never replaced when `preserveCodeBlocks` is `true` (the default). Detection warnings skip protected zones too.
- With `preserveCodeBlocks: false`, blobs in code blocks and tables are warned about and stripped like any other text.

## Interaction with other options

`stripBinaryBlobs` runs after `removeArticles` and before `stripDecorative`, so leftover whitespace around a removed placeholder is tidied up by the later whitespace transforms. When both `stripBinaryBlobs: true` and `report: true` are set, `stats` reflect the stripped output while `warnings` still describe the blobs found in the original input.
