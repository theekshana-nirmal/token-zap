# TokenZap

<div>
  <img src="assets/logo.webp" alt="TokenZap Logo" width="800">
</div>

TokenZap is a lightweight, deterministic text optimizer for LLM prompts. It removes hidden token waste—extra spaces, invisible characters, decorative formatting—without changing semantic meaning.

## Installation

```bash
npm install @thee-nix/token-zap
```

**New in v1.4.0:** Get real token savings with `report: true`:

``typescript
const result = tokenZap(text, {
report: true,
tokenizer: (text) => Math.ceil(text.length / 4)
});

console.log(result.stats.tokensSaved); // See actual token count reduction
``

See [Token Analytics Guide](./docs/token-analytics.md) for details.

## Quick Start

```ts
import { tokenZap } from "@thee-nix/token-zap";

const text = "This  has   extra spaces and\u200Binvisible chars.";
const cleaned = tokenZap(text);

console.log(cleaned);
// Output: "This has extra spaces and invisible chars."
```

**New in v1.4.0:** Get real token savings with `report: true`:

``typescript
const result = tokenZap(text, {
report: true,
tokenizer: (text) => Math.ceil(text.length / 4)
});

console.log(result.stats.tokensSaved); // See actual token count reduction
``

See [Token Analytics Guide](./docs/token-analytics.md) for details.

## Features

- **Trim Extra Spaces** - Collapses consecutive spaces, removes trailing whitespace
- **Unicode Sanitization** (default on) - Removes zero-width spaces, BOM, soft hyphens, and other invisible characters
- **Strip Decorative Lines** (default on) - Removes `---`, `===`, `***` separator lines
- **Typography Normalization** (opt-in) - Converts smart quotes and em dashes to plain ASCII
- **Remove Articles** (opt-in) - Removes "a", "an", "the" to reduce token count
- **Zone-Aware Protection** - Preserves formatting inside code blocks, inline code, and markdown tables

## Options

| Option                | Type    | Default | Description                                                                               |
| --------------------- | ------- | ------- | ----------------------------------------------------------------------------------------- |
| `sanitizeUnicode`     | boolean | `true`  | Removes invisible characters (zero-width spaces, BOM, etc.) and applies NFC normalization |
| `normalizeTypography` | boolean | `false` | Converts smart quotes, em dashes, and ellipsis to plain ASCII equivalents (opt-in)        |
| `trimExtraSpaces`     | boolean | `true`  | Collapses multiple consecutive spaces into one and removes trailing whitespace per line   |
| `preserveCodeBlocks`  | boolean | `true`  | Protects fenced code blocks, inline code, and markdown tables from all transforms         |
| `removeArticles`      | boolean | `false` | Removes English articles ("a", "an", "the") from prose to reduce token count              |
| `stripDecorative`     | boolean | `true`  | Removes decorative separator lines and collapses excessive blank lines                    |

See [docs/options.md](docs/options.md) for complete reference.

## Documentation

- [Complete Options Reference](docs/options.md)
- [Usage Examples](docs/examples.md)
- [Unicode Sanitization](docs/unicode-sanitization.md)
- [Decorative Formatting Removal](docs/strip-decorative.md)

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
};

const result = tokenZap("Hello   world", options);
```

**New in v1.4.0:** Get real token savings with `report: true`:

``typescript
const result = tokenZap(text, {
report: true,
tokenizer: (text) => Math.ceil(text.length / 4)
});

console.log(result.stats.tokensSaved); // See actual token count reduction
``

See [Token Analytics Guide](./docs/token-analytics.md) for details.

## Contributing

```bash
npm install   # Install dependencies
npm run build # Compile TypeScript
npm test      # Run all tests
```

**New in v1.4.0:** Get real token savings with `report: true`:

``typescript
const result = tokenZap(text, {
report: true,
tokenizer: (text) => Math.ceil(text.length / 4)
});

console.log(result.stats.tokensSaved); // See actual token count reduction
``

See [Token Analytics Guide](./docs/token-analytics.md) for details.

## Repository

[https://github.com/theekshana-nirmal/token-zap](https://github.com/theekshana-nirmal/token-zap)

## License

MIT
