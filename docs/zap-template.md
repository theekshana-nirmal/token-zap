# Zap Tagged Template Literal

When constructing prompts for an AI, you usually write standard template sentences (static text) and inject dynamic data like user input or API results into them (interpolated values).

The zap function lets you automatically clean and optimize only the messy dynamic data you insert, without messing up the surrounding prompt template.

`zap` is a tagged template literal that optimizes interpolated values while leaving static template text untouched. It is a convenience wrapper around `tokenZap()` for inline prompt construction.

## Basic Usage

```ts
import { zap } from "@thee-nix/token-zap";

const rawData = "some   messy    data";
const prompt = zap`Analyze this: ${rawData}`;

console.log(prompt);
// Output: "Analyze this: some messy data"
```

Only the interpolated values (`${rawData}`) are passed through the optimization pipeline. The static template text you wrote is preserved exactly as written, including any spacing.

## Multiple Interpolations

```ts
const summary = "This   has   extra   spaces.";
const userInput = "Also   has   extra   spaces.";

const prompt = zap`Summary: ${summary}\nUser input: ${userInput}`;
```

Each interpolated value is cleaned independently, in order.

## Configured Variant

For cases that need non-default options, use `zap.with(options)`, which returns a new tagged template function bound to those options:

```ts
const zapNoArticleRemoval = zap.with({ removeArticles: true });

const prompt = zapNoArticleRemoval`Context: ${"the quick brown fox"}`;
// Output: "Context: quick brown fox"
```

`zap.with()` accepts the same options as `tokenZap()`, except `report`, which is not applicable since `zap` always returns a plain string.

## Stringification Rules

Interpolated values are converted to strings before cleaning, using the following rules:

| Value type                                        | Behavior                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `string`                                          | Used as-is                                                             |
| `number`, `boolean`, `bigint`                     | Converted with `String(value)`                                         |
| `null`, `undefined`                               | Converted to an empty string (not the literal text "null"/"undefined") |
| `object`, `array`                                 | Converted with `JSON.stringify(value)`                                 |
| Non-serializable object (e.g. circular reference) | Falls back to `String(value)`                                          |

```ts
zap`Value: ${undefined}`; // "Value: "
zap`Value: ${null}`; // "Value: "
zap`Count: ${42}`; // "Count: 42"
zap`Data: ${{ a: 1 }}`; // 'Data: {"a":1}'
```

The `null`/`undefined` handling is intentional: it prevents optional or missing values from leaking the literal text "null" or "undefined" into a prompt, which is a common copy-paste mistake in manually constructed prompts.

## When to Use zap vs tokenZap

Use `zap` when building a prompt inline with multiple interpolated values, to avoid manually wrapping each one in `tokenZap()`. Use `tokenZap()` directly when you need to clean a single, already-assembled string, or when you need the `report: true` analytics output.
