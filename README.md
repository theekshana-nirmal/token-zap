# TokenZap

<div>
  <img src="assets/logo.webp" alt="TokenZap Logo" width="800">
</div>

TokenZap is a lightweight utility designed to optimize text payloads before they are sent to Large Language Models (LLMs). By systematically identifying and removing redundant spacing, unnecessary characters, and structural filler, the tool helps developers reduce API token consumption and lower operational costs.

Because LLM tokenizers process text differently than humans, hidden characters like consecutive spaces, trailing lines, and specific structural markers inflate your token count without adding any semantic value. TokenZap strips away this hidden overhead, enabling you to fit more actual content into the model's context window.

## Installation

```bash
npm install @theenix/token-zap

```

## Usage

### Basic Guide

TokenZap exports a single function called `tokenZap` that accepts a text string and an options object:

```ts
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   sample    text with extra spaces.";
const cleaned = tokenZap(text);

console.log(cleaned);
// Output: "This is a sample text with extra spaces."
```

### Options

| Option               | Type    | Default | Description                                                                             |
| -------------------- | ------- | ------- | --------------------------------------------------------------------------------------- |
| `trimExtraSpaces`    | boolean | `true`  | Collapses multiple consecutive spaces into one and removes trailing whitespace per line |
| `preserveCodeBlocks` | boolean | `true`  | Protects fenced code blocks, inline code, and markdown tables from all transforms       |
| `removeArticles`     | boolean | `false` | Removes English articles ("a", "an", "the") from prose to reduce token count            |

### Examples

#### Trim Extra Spaces (Default Behavior)

```ts
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   line with   extra spaces.";
const result = tokenZap(text);

console.log(result);
// Output: "This is a line with extra spaces."
```

#### Safely Clean Prompts Containing Code

By default, `preserveCodeBlocks` is `true`, so code formatting is never touched:

```ts
import { tokenZap } from "@theenix/token-zap";

const prompt = `Here is   the function:

\`\`\`js
function   greet( name ) {
    return   "Hello, " + name;
}
\`\`\`

Call it like this: \`greet("Alice")\`

That is   how it   works.`;

const result = tokenZap(prompt);

// Prose spaces are collapsed. Code block and inline code are untouched.
```

#### Remove Articles from Prose

```ts
import { tokenZap } from "@theenix/token-zap";

const text = "The quick brown fox jumps over the lazy dog.";
const result = tokenZap(text, { removeArticles: true });

console.log(result);
// Output: "quick brown fox jumps over lazy dog."
```

Articles inside code blocks and inline code are preserved automatically:

```ts
const prompt = `Use the \`the\` variable to get the result.`;
const result = tokenZap(prompt, { removeArticles: true });

console.log(result);
// Output: "Use \`the\` variable to get result."
// Note: "the" inside backticks is preserved. "the" in prose is removed.
```

#### Disable Code Block Protection

Only do this if you are certain your text contains no code or structured content:

````ts
import { tokenZap } from "@theenix/token-zap";

const text = "Code:   ```let   x = 5;```   Done.";
const result = tokenZap(text, { preserveCodeBlocks: false });

console.log(result);
// Output: "Code: ```let x = 5;``` Done."
````

#### Disable Space Trimming

```ts
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   sample.";
const result = tokenZap(text, { trimExtraSpaces: false, removeArticles: true });

console.log(result);
// Output: "This is     sample."
```

## TypeScript Support

TokenZap is written in TypeScript and ships with full type declarations. The `TokenZapOptions` interface is exported for use in typed projects:

```ts
import { tokenZap, TokenZapOptions } from "@theenix/token-zap";

const options: TokenZapOptions = {
  trimExtraSpaces: true,
  preserveCodeBlocks: true,
  removeArticles: false,
};

const result = tokenZap("Hello   world", options);
```

## Contributing

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

```

## Repository

[https://github.com/theekshana-nirmal/token-zap](https://github.com/theekshana-nirmal/token-zap)

## License

MIT
