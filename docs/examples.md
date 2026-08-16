# Usage Examples

Real-world examples of TokenZap in action.

## Basic Usage

### Collapse Extra Spaces

```ts
import { tokenZap } from "@thee-nix/token-zap";

const text = "This  has   extra    spaces.";
const result = tokenZap(text);

console.log(result);
// Output: "This has extra spaces."
```

### Remove Invisible Characters (Default Behavior)

```ts
const text = "\uFEFFHello\u200B world\u00A0here";
const result = tokenZap(text);

console.log(result);
// Output: "Hello world here"
```

### Remove Decorative Lines (Default Behavior)

```ts
const text = `Section One
-------------------
Content here.`;

const result = tokenZap(text);

console.log(result);
// Output:
// Section One
// Content here.
```

---

## Safely Clean Code-Containing Prompts

By default, `preserveCodeBlocks: true` protects all code formatting.

### Fenced Code Blocks

```ts
const prompt = `Fix this function:

\`\`\`js
function   add( a,  b ) {
    return   a + b;
}
\`\`\`

It has   extra spaces.`;

const result = tokenZap(prompt);

console.log(result);
// Prose spaces collapsed, code block untouched
```

### Inline Code

```ts
const prompt = "Use the   `let   x = 5;` statement here.";
const result = tokenZap(prompt);

console.log(result);
// Output: "Use the `let   x = 5;` statement here."
```

### Markdown Tables

```ts
const prompt = `Results below:

| Name  |   Score |
|-------|---------|
| Alice |      95 |

That is   the table.`;

const result = tokenZap(prompt);

// Table spacing preserved, prose spacing collapsed
```

---

## Advanced Options

### Remove Articles (Opt-In)

```ts
const text = "The quick brown fox jumps over the lazy dog.";
const result = tokenZap(text, { removeArticles: true });

console.log(result);
// Output: "quick brown fox jumps over lazy dog."
```

Articles inside code are automatically preserved:

```ts
const prompt = `Use the \`the\` variable.`;
const result = tokenZap(prompt, { removeArticles: true });

console.log(result);
// Output: "Use \`the\` variable."
```

### Normalize Typography (Opt-In)

```ts
const text = ""It's amazing," she said—really…";
const result = tokenZap(text, { normalizeTypography: true });

console.log(result);
// Output: "\"It's amazing,\" she said--really..."
```

### Disable Code Block Protection

**Warning:** Only use if your text contains no code or structured content.

````ts
const text = "Code:   ```let   x = 5;```   done.";
const result = tokenZap(text, { preserveCodeBlocks: false });

console.log(result);
// Output: "Code: ```let x = 5;``` done."
````

---

## Combining Multiple Options

```ts
const text = `The document below:

-------------------

\`\`\`js
const the = "test";
\`\`\`

That is   the   code.`;

const result = tokenZap(text, {
  removeArticles: true,
  stripDecorative: true,
  trimExtraSpaces: true,
  preserveCodeBlocks: true,
});

console.log(result);
// Decorative line removed
// Articles removed from prose
// Code block unchanged
```

---

## Disable Specific Transforms

### Keep Extra Spaces

```ts
const text = "hello   world";
const result = tokenZap(text, { trimExtraSpaces: false });

console.log(result);
// Output: "hello   world"
```

### Keep Decorative Lines

```ts
const text = "Title\n---\nBody";
const result = tokenZap(text, { stripDecorative: false });

console.log(result);
// Output: "Title\n---\nBody"
```

### Disable Unicode Sanitization

```ts
const text = "hello\u200Bworld";
const result = tokenZap(text, {
  sanitizeUnicode: false,
  trimExtraSpaces: false,
});

console.log(result);
// Output: "hello\u200Bworld" (zero-width space preserved)
```

---

## TypeScript Usage

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

const result = tokenZap("Your   text here", options);
```

## Token Analytics

### Basic Usage with Custom Tokenizer

``typescript
import { tokenZap } from "@thee-nix/token-zap";

const text = "The quick brown fox";

const result = tokenZap(text, {
report: true,
tokenizer: (text) => Math.ceil(text.length / 4),
removeArticles: true,
trimExtraSpaces: true
});

console.log(result.output);
// "quick brown fox"

console.log(result.stats);
// {
// originalTokens: 8,
// cleanedTokens: 4,
// tokensSaved: 4,
// percentSaved: 50.0
// }
``

### Using js-tiktoken for Accurate Counts

``typescript
import { tokenZap } from "@thee-nix/token-zap";
// Requires: npm install js-tiktoken

const longPrompt = /_ your LLM prompt _/;

const result = tokenZap(longPrompt, { report: true });

console.log(`Saved \ tokens (`\%)`);
``

### Cost Estimation Example

``typescript
import { tokenZap } from "@thee-nix/token-zap";
import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-4");

function optimizeAndEstimateCost(text: string) {
const result = tokenZap(text, {
report: true,
tokenizer: (t) => encoder.encode(t).length,
trimExtraSpaces: true,
sanitizeUnicode: true,
stripDecorative: true
});

const GPT4_INPUT_COST_PER_TOKEN = 0.00003;
const costSaved = result.stats.tokensSaved \* GPT4_INPUT_COST_PER_TOKEN;

return {
optimizedText: result.output,
tokensSaved: result.stats.tokensSaved,
costSaved: `\$`\`
};
}
``
