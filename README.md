# TokenZap

<div>
  <img src="assets/logo.webp" alt="TokenZap Logo" width="800">
</div>

TokenZap is a lightweight utility designed to optimize text payloads before they are sent to Large Language Models (LLMs). By systematically identifying and removing redundant spacing, unnecessary characters, and structural filler, the tool helps developers reduce API token consumption and lower operational costs.

Because LLM tokenizers process text differently than humans, hidden characters like consecutive spaces, trailing lines, and specific structural markers inflate your token count without adding any semantic value. TokenZap strips away this hidden overhead, enabling you to fit more actual content into the model's context window.

## Installation

You can install TokenZap directly from the npm registry using the following command:

```bash
npm install @theenix/token-zap
```

## Usage

### Basic Guide

TokenZap exports a single function called `tokenZap` that accepts a text string and an options object. Here is a simple example:

```js
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   sample    text with extra spaces.";
const cleaned = tokenZap(text);

console.log(cleaned);
// Output: "This is a sample text with extra spaces."
```

### Options

The `tokenZap` function accepts the following options:

- **trimExtraSpaces** (boolean, default: `true`) - When set to `true`, removes extra spaces and collapses multiple spaces into single spaces. This option is enabled by default.

- **preserveCodeBlocks** (boolean, default: `true`) - When set to `true`, protects fenced code blocks (` ``` `), inline code (`` ` ``), and markdown tables from space-trimming logic. This ensures code indentation and formatting remain intact while still optimizing surrounding prose. Set to `false` to apply space-trimming everywhere (use with caution if your text contains code).

- **removeArticles** (boolean, default: `false`) - When set to `true`, removes articles like "a", "an", and "the" from the text. This can further reduce token count but may affect readability. **Note:** This option is not currently zone-aware and will remove articles from inside code blocks too. Avoid combining it with prompts containing code until a future update addresses this.

### Examples

#### Remove Extra Spaces Only

```js
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   line with   extra spaces.";
const result = tokenZap(text);

console.log(result);
// Output: "This is a line with extra spaces."
```

#### Safely Clean Prompts with Mixed Code and Prose

````js
import { tokenZap } from "@theenix/token-zap";

const prompt = `Here is   the function:

\`\`\`js
function   greet( name ) {
    return   "Hello, " + name;
}
\`\`\`

Call   it like   this: \`greet(  "Alice"  )\`

That is   how it   works.`;

const result = tokenZap(prompt);

console.log(result);
// Output:
// Here is the function:
//
// ```js
// function   greet( name ) {
//     return   "Hello, " + name;
// }
// ```
//
// Call it like this: `greet(  "Alice"  )`
//
// That is how it works.
````

Notice how spaces inside the fenced code block and inline code spans are preserved exactly, while extra spaces in the prose are collapsed.

#### Remove Articles and Extra Spaces

```js
import { tokenZap } from "@theenix/token-zap";

const text = "The quick brown fox jumps over the lazy dog.";
const result = tokenZap(text, { removeArticles: true });

console.log(result);
// Output: "quick brown fox jumps over lazy dog."
```

#### Disable Trimming Extra Spaces

```js
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   sample.";
const result = tokenZap(text, { trimExtraSpaces: false, removeArticles: true });

console.log(result);
// Output: "This is     sample."
```

#### Disable Code Block Protection (Use Carefully)

````js
import { tokenZap } from "@theenix/token-zap";

const text = "Code:   ```let   x = 5;```   Done.";
const result = tokenZap(text, { preserveCodeBlocks: false });

console.log(result);
// Output: "Code: ```let x = 5;``` Done."
````

When `preserveCodeBlocks` is `false`, space-collapsing applies everywhere, including inside code. Only disable this if you are certain your text contains no code or structured content.

## Future Plans

TokenZap is actively being developed. Here are some features planned for future releases:

- Support for removing common filler words and stop words to further reduce token count.
- Language-specific optimization for different languages beyond English.
- Statistics and reporting features to show how many tokens were saved.
- Customizable word removal lists for domain-specific text optimization.
- Performance improvements for processing large text documents.
- Integration with popular LLM libraries for seamless prompt optimization.
- Zone-aware `removeArticles` to safely skip article removal inside code blocks.

## Repository Link

The source code is available on GitHub:
[https://github.com/theekshana-nirmal/token-zap](https://www.google.com/search?q=https://github.com/theekshana-nirmal/token-zap)
