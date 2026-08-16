# Token Analytics Guide

TokenZap v1.4.0+ includes real token counting to measure actual token savings.

## Overview

TokenZap requires you to provide a tokenizer function. This keeps the package lightweight and flexible for any LLM provider.

**Important:** Different LLM providers use different tokenization algorithms. You must use a tokenizer matching your target model, or counts will be inaccurate.

## Quick Start

### Simple Estimator (No Dependencies)

```typescript
import { tokenZap } from "@thee-nix/token-zap";

const result = tokenZap("Hello    world", {
  report: true,
  tokenizer: (text) => Math.ceil(text.length / 4),
});

console.log(result.stats);
// {
//   originalTokens: 4,
//   cleanedTokens: 3,
//   tokensSaved: 1,
//   percentSaved: 25.0
// }
```

### Production Usage

Install a tokenizer matching your target LLM:

**OpenAI (GPT-4, GPT-3.5):**

```bash
npm install gpt-tokenizer
```

```typescript
import { tokenZap } from "@thee-nix/token-zap";
import { encode } from "gpt-tokenizer";

const result = tokenZap(text, {
  report: true,
  tokenizer: (text) => encode(text).length,
});
```

**Other providers:**

- Anthropic (Claude): `@anthropic-ai/tokenizer`
- Meta (LLaMA): `llama3-tokenizer-js`
- Mistral: `@mistralai/tokenizer-js`

## API Reference

### `report?: boolean`

**Default:** `false`

Returns analytics instead of cleaned string. Requires `tokenizer` parameter.

```typescript
const result = tokenZap(text, {
  report: true,
  tokenizer: myTokenizer,
});
```

### `tokenizer?: (text: string) => number`

**Required when:** `report: true`

Function to count tokens. Accepts text, returns token count.

```typescript
// Simple estimator
const estimator = (text: string) => Math.ceil(text.length / 4);

// Production tokenizer
import { encode } from "gpt-tokenizer";
const tokenizer = (text: string) => encode(text).length;
```

### `TokenZapResult`

```typescript
interface TokenZapResult {
  output: string;
  stats: {
    originalTokens: number;
    cleanedTokens: number;
    tokensSaved: number;
    percentSaved: number;
  };
}
```

## Examples

### Basic Token Savings

```typescript
import { tokenZap } from "@thee-nix/token-zap";
import { encode } from "gpt-tokenizer";

const text = "The    quick   brown    fox";

const result = tokenZap(text, {
  report: true,
  tokenizer: (t) => encode(t).length,
  removeArticles: true,
  trimExtraSpaces: true,
});

console.log(result.stats);
// { originalTokens: 7, cleanedTokens: 4, tokensSaved: 3, percentSaved: 42.86 }
```

### Cost Estimation

```typescript
import { tokenZap } from "@thee-nix/token-zap";
import { encode } from "gpt-tokenizer";

const result = tokenZap(text, {
  report: true,
  tokenizer: (t) => encode(t).length,
  trimExtraSpaces: true,
  sanitizeUnicode: true,
});

const GPT4_COST_PER_1K = 0.03;
const costSaved = (result.stats.tokensSaved / 1000) * GPT4_COST_PER_1K;

console.log(
  `Saved ${result.stats.tokensSaved} tokens ($${costSaved.toFixed(4)})`,
);
```

### Multi-Model Support

```typescript
import { encode as encodeGPT } from "gpt-tokenizer";
import { countTokens as countClaude } from "@anthropic-ai/tokenizer";

type Provider = "openai" | "anthropic";

function getTokenizer(provider: Provider) {
  return provider === "openai"
    ? (text: string) => encodeGPT(text).length
    : (text: string) => countClaude(text);
}

const result = tokenZap(text, {
  report: true,
  tokenizer: getTokenizer("openai"),
});
```

## TypeScript Support

Function overloads provide type safety:

```typescript
const text1 = tokenZap("hello");
// Type: string

const result = tokenZap("hello", {
  report: true,
  tokenizer: (t) => t.length,
});
// Type: TokenZapResult
```

## Error Handling

Missing tokenizer throws helpful error:

```typescript
tokenZap("hello", { report: true });
// Error: Token counting requires a tokenizer function.
//
// Install a tokenizer package matching your LLM:
//   • OpenAI (GPT): npm install gpt-tokenizer
//   • Anthropic (Claude): npm install @anthropic-ai/tokenizer
//   • Meta (LLaMA): npm install llama3-tokenizer-js
//   • Mistral: npm install @mistralai/tokenizer-js
```

## Tokenizer Recommendations

| Provider       | Package                   | Installation                          |
| -------------- | ------------------------- | ------------------------------------- |
| OpenAI         | `gpt-tokenizer`           | `npm install gpt-tokenizer`           |
| Anthropic      | `@anthropic-ai/tokenizer` | `npm install @anthropic-ai/tokenizer` |
| Meta (LLaMA 3) | `llama3-tokenizer-js`     | `npm install llama3-tokenizer-js`     |
| Mistral        | `@mistralai/tokenizer-js` | `npm install @mistralai/tokenizer-js` |

**Simple estimator (no install):** `(text) => Math.ceil(text.length / 4)`

## Performance

For bulk processing, reuse tokenizer instances:

```typescript
import { encode } from "gpt-tokenizer";

const tokenizer = (text: string) => encode(text).length;

for (const doc of documents) {
  const result = tokenZap(doc, { report: true, tokenizer });
}
```

## FAQ

**Q: Which tokenizer should I use?**  
A: Match your target LLM. For OpenAI models use `gpt-tokenizer`, for Claude use `@anthropic-ai/tokenizer`, etc.

**Q: Can I use TokenZap without installing a tokenizer?**  
A: Yes, use a simple estimator: `tokenizer: (t) => Math.ceil(t.length / 4)`

**Q: Why doesn't TokenZap bundle a tokenizer?**  
A: To stay lightweight and flexible for any LLM provider.

**Q: Why is my token count different from the LLM provider's count?**  
A: Ensure you're using the correct tokenizer for your specific model. Different models use different tokenization schemes.
