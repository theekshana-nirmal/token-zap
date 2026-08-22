# TokenZap

<div>
  <img src="assets/logo.webp" alt="TokenZap Logo" width="800">
</div>

TokenZap is a lightweight, deterministic text optimizer for LLM prompts. It removes hidden token waste-extra spaces, invisible characters, decorative formatting-without changing semantic meaning.

## Installation

```bash
npm install @thee-nix/token-zap
```

## Quick Start

```ts
import { tokenZap } from "@thee-nix/token-zap";

const text = "This  has   extra spaces and\u200Binvisible chars.";
const cleaned = tokenZap(text);

console.log(cleaned);
// Output: "This has extra spaces and invisible chars."
```

**New in v1.6.0:** Use the `zap` tagged template literal to optimize interpolated values inline, without wrapping every variable in `tokenZap()`:

```typescript
import { zap } from "@thee-nix/token-zap";

const rawData = "some   messy    data";
const prompt = zap`Analyze this: ${rawData}`;
```

See [Zap Tagged Template](./docs/zap-template.md) for details, including the `zap.with(options)` configured variant.

## Features

- **Trim Extra Spaces** - Collapses consecutive spaces, removes trailing whitespace
- **Unicode Sanitization** (default on) - Removes zero-width spaces, BOM, soft hyphens, and other invisible characters
- **Strip Decorative Lines** (default on) - Removes `---`, `===`, `***` separator lines
- **Typography Normalization** (opt-in) - Converts smart quotes and em dashes to plain ASCII
- **Remove Articles** (opt-in) - Removes "a", "an", "the" to reduce token count
- **Binary Blob Detection** - Warns about accidentally pasted base64/binary data; opt-in `stripBinaryBlobs` replaces blobs with a placeholder
- **Zone-Aware Protection** - Preserves formatting inside code blocks, inline code, and markdown tables
- **Plugin System** (opt-in) - Add custom text-cleaning rules via `plugins: []` without forking the package
- **Zap Tagged Template** (convenience) - Optimize interpolated values inline with `` zap`text ${value}` `` without wrapping each variable in `tokenZap()`

## Options

| Option                | Type               | Default | Description                                                                               |
| --------------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `sanitizeUnicode`     | boolean            | `true`  | Removes invisible characters (zero-width spaces, BOM, etc.) and applies NFC normalization |
| `normalizeTypography` | boolean            | `false` | Converts smart quotes, em dashes, and ellipsis to plain ASCII equivalents (opt-in)        |
| `trimExtraSpaces`     | boolean            | `true`  | Collapses multiple consecutive spaces into one and removes trailing whitespace per line   |
| `preserveCodeBlocks`  | boolean            | `true`  | Protects fenced code blocks, inline code, and markdown tables from all transforms         |
| `removeArticles`      | boolean            | `false` | Removes English articles ("a", "an", "the") from prose to reduce token count              |
| `stripDecorative`     | boolean            | `true`  | Removes decorative separator lines and collapses excessive blank lines                    |
| `stripBinaryBlobs`    | boolean            | `false` | Replaces detected base64/binary data blobs with a placeholder (warn-only by default)       |
| `plugins`             | `TokenZapPlugin[]` | `[]`    | Runs custom user-defined text transforms after all built-in transforms                    |

See [docs/options.md](docs/options.md) for complete reference.

## Writing a Plugin

A plugin is a pure function: `(text: string) => string`. Plugins run last in the pipeline, after every built-in transform, and are not zone-aware (they see restored code blocks and tables as plain text).

```ts
import { tokenZap, TokenZapPlugin } from "@thee-nix/token-zap";

const redactEmails: TokenZapPlugin = (text) =>
  text.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[email]");

const cleaned = tokenZap(text, { plugins: [redactEmails] });
```

Multiple plugins run in array order, each receiving the previous plugin's output. See [docs/plugins.md](docs/plugins.md) for the full guide, including how to write plugins that avoid modifying code blocks.

## Documentation

- [Complete Options Reference](docs/options.md)
- [Usage Examples](docs/examples.md)
- [Unicode Sanitization](docs/unicode-sanitization.md)
- [Decorative Formatting Removal](docs/strip-decorative.md)
- [Binary Blob Detection](docs/binary-blob-detection.md)
- [Plugin System](docs/plugins.md)
- [Zap Tagged Template](docs/zap-template.md)

## TypeScript Support

TokenZap is written in TypeScript and ships with full type declarations:

```ts
import { tokenZap, TokenZapOptions } from "@thee-nix/token-zap";

const options: TokenZapOptions = {
  trimExtraSpaces: true,
  preserveCodeBlocks: true,
  removeArticles: false,
  sanitizeUnicode: true,
  normalizeTypography: false,
  stripDecorative: true,
  plugins: [],
};

const result = tokenZap("Hello   world", options);
```

## Contributing

```bash
npm install   # Install dependencies
npm run build # Compile TypeScript
npm test      # Run all tests
```

## Repository

[https://github.com/theekshana-nirmal/token-zap](https://github.com/theekshana-nirmal/token-zap)

## License

MIT
