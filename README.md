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

- **removeArticles** (boolean, default: `false`) - When set to `true`, removes articles like "a", "an", and "the" from the text. This can further reduce token count but may affect readability.

- **trimExtraSpaces** (boolean, default: `true`) - When set to `true`, removes extra spaces and collapses multiple spaces into single spaces. This option is enabled by default.

### Examples

#### Remove Extra Spaces Only

```js
import { tokenZap } from "@theenix/token-zap";

const text = "This is  a   line with   extra spaces.";
const result = tokenZap(text);

console.log(result);
// Output: "This is a line with extra spaces."
```

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

## Future Plans

TokenZap is actively being developed. Here are some features planned for future releases:

- Support for removing common filler words and stop words to further reduce token count.
- Language-specific optimization for different languages beyond English.
- Statistics and reporting features to show how many tokens were saved.
- Customizable word removal lists for domain-specific text optimization.
- Performance improvements for processing large text documents.
- Integration with popular LLM libraries for seamless prompt optimization.

## Repository Link

The source code is available on GitHub:
[https://github.com/theekshana-nirmal/token-zap](https://www.google.com/search?q=https://github.com/theekshana-nirmal/token-zap)