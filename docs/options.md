# Options Reference

Complete documentation for all TokenZap configuration options.

## Overview

```ts
import { tokenZap, TokenZapOptions } from "@thee-nix/token-zap";

const options: TokenZapOptions = {
  sanitizeUnicode: true, // Remove invisible characters (default: on)
  normalizeTypography: false, // Convert smart quotes to ASCII (default: off)
  trimExtraSpaces: true, // Collapse multiple spaces (default: on)
  preserveCodeBlocks: true, // Protect code/tables (default: on)
  removeArticles: false, // Remove "a", "an", "the" (default: off)
  stripDecorative: true, // Remove separator lines (default: on)
  plugins: [], // Custom user-defined text transforms (default: none)
};

const result = tokenZap(text, options);
```

## Options

### `sanitizeUnicode` (default: `true`)

Removes invisible and zero-width Unicode characters that waste tokens without adding meaning. Also applies Unicode NFC normalization.

**Characters removed:**

- Zero-width space (`U+200B`)
- Zero-width non-joiner (`U+200C`)
- Zero-width joiner (`U+200D`)
- Word joiner (`U+2060`)
- Byte order mark / BOM (`U+FEFF`)
- Non-breaking space (`U+00A0`) -> replaced with regular space
- Soft hyphen (`U+00AD`)
- Left-to-right mark (`U+200E`)
- Right-to-left mark (`U+200F`)

**Safe to enable by default:** Yes. These characters are never semantically meaningful in LLM prompts.

**Example:**

```ts
tokenZap("\uFEFFHello\u200B world"); // "Hello world"
```

See [unicode-sanitization.md](unicode-sanitization.md) for details.

---

### `normalizeTypography` (default: `false`)

Converts typographic "smart" characters to plain ASCII equivalents.

**Conversions:**

- Smart single quotes -> apostrophe (`'`)
- Smart double quotes -> straight quotes (`"`)
- Em dash -> double hyphen (`--`)
- En dash -> single hyphen (`-`)
- Horizontal ellipsis -> three dots (`...`)

**Safe to enable by default:** No. This changes visual style.

**When to use:**

- You need maximum ASCII compatibility
- Your tokenizer treats smart quotes inefficiently
- You want consistent quote/dash representation

**Zone behavior:** Unlike other transforms, `normalizeTypography` applies to **all text**, including inside code blocks. This is intentional because smart quotes in code are almost always accidental (copy-pasted from documents) and converting them actually fixes broken code.

**Example:**

```ts
tokenZap('"Hello" -- wait...', { normalizeTypography: true });
// Output: "\"Hello\" -- wait..."
```

See [unicode-sanitization.md](unicode-sanitization.md) for details.

---

### `trimExtraSpaces` (default: `true`)

Collapses multiple consecutive spaces into one, removes trailing whitespace per line, and collapses excessive blank lines.

**Safe to enable by default:** Yes. Extra spaces are never meaningful in LLM prompts.

**Example:**

```ts
tokenZap("hello   world"); // "hello world"
```

---

### `preserveCodeBlocks` (default: `true`)

Master toggle that protects fenced code blocks, inline code, and markdown tables from all transforms.

**Protected zones:**

- Fenced code blocks: ` ``` ` and `~~~`
- Inline code: `` `code` ``
- Markdown tables: pipe-delimited rows

**Safe to enable by default:** Yes. Disabling risks corrupting code formatting.

**Example:**

```ts
const text = "Use  `let   x = 5;`  here.";
tokenZap(text); // "Use `let   x = 5;` here."
// Spaces inside backticks are preserved
```

---

### `removeArticles` (default: `false`)

Removes English articles ("a", "an", "the") from prose to reduce token count.

**Safe to enable by default:** No. This changes meaning and tone.

**Zone-aware:** Articles inside code blocks and tables are preserved.

**Example:**

```ts
tokenZap("The cat sat on a mat.", { removeArticles: true });
// Output: "cat sat on mat."
```

---

### `stripDecorative` (default: `true`)

Removes decorative separator lines (repeated `-`, `=`, `*`, etc.) and collapses 3+ blank lines into one.

**Decorator detection:**

- Line must contain only one repeated character
- Minimum 3 repetitions
- Allowed characters: `-` `=` `*` `_` `~` `+` `#`

**Zone-aware:** Separator lines inside code blocks and markdown tables are preserved.

**Example:**

```ts
tokenZap("Section\n-------------------\nContent");
// Output: "Section\nContent"
```

See [strip-decorative.md](strip-decorative.md) for complete reference.

---

### `plugins` (default: `[]`)

Runs an ordered list of custom, user-defined text transforms after all built-in transforms have completed.

**Type:** `TokenZapPlugin[]`, where `TokenZapPlugin` is `(text: string) => string`

**Safe to enable by default:** N/A - opt-in by nature; empty array means no-op.

**Runs last, after:** `sanitizeUnicode`, `normalizeTypography`, `removeArticles`, `stripDecorative`, `trimExtraSpaces`.

**Not zone-aware:** Plugins run after protected zones have already been restored to their original content. A plugin can modify text inside code blocks or tables unless it explicitly avoids doing so.

**Example:**

```ts
const redactNames: TokenZapPlugin = (text) =>
  text.replace(/John Doe/g, "[REDACTED]");

tokenZap("Contact John Doe for details.", { plugins: [redactNames] });
// Output: "Contact [REDACTED] for details."
```

See [plugins.md](plugins.md) for the complete guide, including how to write zone-safe plugins.

---

## Option Interactions

### Processing Order

Transforms run in this order:

1. `sanitizeUnicode` - Removes invisible characters first
2. `normalizeTypography` - Converts smart quotes/dashes
3. `removeArticles` - Content-level word removal
4. `stripDecorative` - Removes separator lines and blank lines
5. `trimExtraSpaces` - Final cleanup of leftover gaps
6. `plugins` - Custom user-defined transforms, run last

### `preserveCodeBlocks: false`

When disabled, all transforms apply to code blocks and tables. **Use with extreme caution.**

```ts
tokenZap("Code: `let   x = 5;`", { preserveCodeBlocks: false });
// Output: "Code: `let x = 5;`"
// Spaces inside backticks were collapsed
```

### Plugins and Zone Protection

Plugins always run after `preserveCodeBlocks` protection has already been lifted (protected zones are restored before plugins execute), regardless of the `preserveCodeBlocks` setting. If your plugin must not touch code blocks or tables, implement that check inside the plugin itself. See [plugins.md](plugins.md) for an example.

### Disable All Transforms

```ts
tokenZap(text, {
  sanitizeUnicode: false,
  normalizeTypography: false,
  trimExtraSpaces: false,
  removeArticles: false,
  stripDecorative: false,
});
// Returns text unchanged (except preserveCodeBlocks logic still runs)
```

## `report`

**Type:** `boolean`
**Default:** `false`
**Added in:** v1.4.0

Returns token analytics instead of just the cleaned string.

When `true`, returns `{ output: string, stats: TokenZapStats }` instead of plain `string`.

Requires either:

- `js-tiktoken` installed (`npm install js-tiktoken`)
- Custom tokenizer via `tokenizer` option

```typescript
const result = tokenZap(text, {
  report: true,
  tokenizer: (text) => Math.ceil(text.length / 4),
});

console.log(result.stats.tokensSaved); // 42
```

If `plugins` are also provided, `cleanedTokens` reflects the text after plugins have run. See [Token Analytics Guide](./token-analytics.md) for details.

---

## `tokenizer`

**Type:** `(text: string) => number`
**Default:** Uses `js-tiktoken` if available, otherwise throws error
**Added in:** v1.4.0

Custom function to count tokens. Only used when `report: true`.

```typescript
import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-3.5-turbo");

const result = tokenZap(text, {
  report: true,
  tokenizer: (text) => encoder.encode(text).length,
});
```

**Common tokenizers:**

- Character-based: `(text) => text.length`
- Word-based: `(text) => text.split(/\s+/).filter(Boolean).length`
- GPT-4: `js-tiktoken` with `encodingForModel("gpt-4")`
