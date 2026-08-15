# Unicode Sanitization

TokenZap removes invisible Unicode characters and normalizes character encoding to reduce hidden token waste.

## Features

### 1. Invisible Character Removal (Default: Enabled)

Removes zero-width and control characters that are invisible to humans but consume tokens.

**Characters removed:**

| Character             | Unicode | Description                                    |
| --------------------- | ------- | ---------------------------------------------- |
| Zero-width space      | U+200B  | Invisible word separator                       |
| Zero-width non-joiner | U+200C  | Prevents character joining in scripts          |
| Zero-width joiner     | U+200D  | Forces character joining in scripts            |
| Word joiner           | U+2060  | Prevents line breaks (like non-breaking space) |
| Byte order mark (BOM) | U+FEFF  | File encoding marker                           |
| Soft hyphen           | U+00AD  | Invisible hyphen for word breaking             |
| LTR mark              | U+200E  | Left-to-right text direction marker            |
| RTL mark              | U+200F  | Right-to-left text direction marker            |
| Non-breaking space    | U+00A0  | Replaced with regular space (U+0020)           |

### 2. Unicode NFC Normalization

Ensures consistent character representation across different encodings.

**Example:**

```ts
const text = "café"; // "e" + combining acute accent (2 code points)
const normalized = text.normalize("NFC"); // "é" precomposed (1 code point)

tokenZap(text); // Automatically applies NFC normalization
```

---

## Usage

### Sanitize Unicode (Default Behavior)

```ts
import { tokenZap } from "@thee-nix/token-zap";

const text = "\uFEFFHello\u200B world";
const result = tokenZap(text);

console.log(result);
// Output: "Hello world"
```

### Disable Unicode Sanitization

```ts
const text = "hello\u200Bworld";
const result = tokenZap(text, { sanitizeUnicode: false });

console.log(result);
// Output: "hello\u200Bworld" (zero-width space preserved)
```

---

## Typography Normalization (Opt-In)

**Important:** Unlike other transforms, `normalizeTypography` applies to **all text**, including code blocks and inline code. This is intentional because smart quotes in code are almost always accidental (copy-pasted from Word/web) and converting them actually fixes broken code.

If you need to preserve smart quotes in specific code examples, do not enable this option.
Converts typographic "smart" characters to plain ASCII equivalents.

### Characters Converted

| Input Character         | Unicode | Output |
| ----------------------- | ------- | ------ |
| Left single quote `'`   | U+2018  | `'`    |
| Right single quote `'`  | U+2019  | `'`    |
| Left double quote `"`   | U+201C  | `"`    |
| Right double quote `"`  | U+201D  | `"`    |
| Em dash `—`             | U+2014  | `--`   |
| En dash `–`             | U+2013  | `-`    |
| Horizontal ellipsis `…` | U+2026  | `...`  |

### Usage

```ts
const text = ""Hello" and 'world'—wait…";
const result = tokenZap(text, { normalizeTypography: true });

console.log(result);
// Output: "\"Hello\" and 'world'--wait..."
```

### When to Use Typography Normalization

**Enable when:**

- You need maximum ASCII compatibility
- Your tokenizer treats smart quotes inefficiently
- You want consistent representation across different text sources

**Disable when:**

- Visual style matters (e.g., user-facing content)
- You want to preserve original formatting from documents

---

## Examples

### Remove BOM from File Header

```ts
const text = "\uFEFFHello World";
const result = tokenZap(text);

console.log(result);
// Output: "Hello World"
```

### Clean Copy-Pasted Text from Word

```ts
const text = "This is\u00A0a test\u2014really…";
const result = tokenZap(text, { normalizeTypography: true });

console.log(result);
// Output: "This is a test--really..."
// Non-breaking space → regular space
// Em dash → double hyphen
// Ellipsis → three dots
```

### Handle Mixed Invisible Characters

```ts
const text = "\uFEFFhello\u200B\u00A0world\u200C\u200Dtest\u00AD";
const result = tokenZap(text);

console.log(result);
// Output: "hello worldtest"
```

### Normalize Unicode Encoding

```ts
const text = "café"; // NFD form (e + combining acute)
const result = tokenZap(text);

console.log(result.length); // Shorter (NFC form)
console.log(result); // "café" (visually identical)
```

---

## Why This Matters for LLMs

### Invisible Characters Waste Tokens

```ts
const text = "hello\u200Bworld";
// Looks like: "helloworld"
// Actually: "hello[ZERO-WIDTH-SPACE]world"
// LLM tokenizer may treat this as 3 tokens instead of 2
```

### Non-Breaking Spaces Are Not Regular Spaces

```ts
const text = "hello\u00A0world";
// Looks like: "hello world"
// Some tokenizers treat U+00A0 differently from U+0020
// Wastes tokens without adding meaning
```

### Unicode Normalization Reduces Variability

```ts
const nfd = "café".normalize("NFD"); // "cafe\u0301" (5 chars)
const nfc = "café".normalize("NFC"); // "café" (4 chars)

// Both look identical, but tokenizers may treat them differently
// NFC is the standard web/API form
```

---

## Safe by Default

Unicode sanitization is **enabled by default** because:

- It never changes semantic meaning
- It only removes characters that are invisible to humans
- It reduces token waste without altering content

Typography normalization is **opt-in** because:

- It changes visual style (smart quotes → straight quotes)
- Some use cases require preserving original formatting
- It should be a conscious decision

---

## Disable Both Features

```ts
const text = "\uFEFF"Hello\u200B world"";
const result = tokenZap(text, {
  sanitizeUnicode: false,
  normalizeTypography: false,
  trimExtraSpaces: false,
});

// Text returned unchanged (except other enabled transforms)
```
