# Plugin System

TokenZap supports custom, user-defined text-cleaning rules through a simple plugin interface. This lets teams handle industry-specific or project-specific token waste without forking the package.

## Plugin Interface

A plugin is a pure function that takes a string and returns a string:

```ts
type TokenZapPlugin = (text: string) => string;
```

## Usage

```ts
import { tokenZap, TokenZapPlugin } from "@thee-nix/token-zap";

const removeLegalBoilerplate: TokenZapPlugin = (text) =>
  text.replace(/This document is confidential\.?/g, "");

const result = tokenZap(text, {
  plugins: [removeLegalBoilerplate],
});
```

Multiple plugins run in the order provided, each receiving the previous plugin's output:

```ts
const result = tokenZap(text, {
  plugins: [pluginA, pluginB, pluginC],
});
// Equivalent to: pluginC(pluginB(pluginA(cleanedText)))
```

## When Plugins Run

Plugins run **last** in the pipeline, after every built-in transform:

1. `sanitizeUnicode`
2. `normalizeTypography`
3. `removeArticles`
4. `stripDecorative`
5. `trimExtraSpaces`
6. **`plugins`** (in array order)

This means:

- Plugins always receive the fully cleaned text as their input.
- Any whitespace or formatting a plugin introduces is **not** re-cleaned by `trimExtraSpaces` or `stripDecorative` afterward, since those already ran.
- When `report: true` is used, `cleanedTokens` and `tokensSaved` are calculated from the text **after** plugins run, so analytics reflect your plugin's effect too.

## Plugins and Protected Zones

Built-in transforms like `stripDecorative`, `trimExtraSpaces`, and `removeArticles` are zone-aware: they mask fenced code blocks, inline code, and markdown tables before running, then restore them afterward.

**Plugins do not get this protection.** By the time plugins run, all protected zones have already been restored to their original literal content, and plugins see the entire document as plain text with no zone information. A plugin's regex or logic can therefore modify content inside code blocks or tables if it is not written carefully.

This is intentional: keeping the plugin contract to a plain `string -> string` function avoids exposing internal masking internals as public API. If your plugin needs to avoid code blocks or tables, handle that within your own plugin logic (for example, skip lines between fenced-code markers).

````ts
// Example: a plugin that avoids fenced code blocks itself
const redactEmails: TokenZapPlugin = (text) => {
  const lines = text.split("\n");
  let inCodeBlock = false;

  return lines
    .map((line) => {
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        return line;
      }
      if (inCodeBlock) return line;
      return line.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[email]");
    })
    .join("\n");
};
````

## Writing a Plugin

A plugin must be:

- **Pure** - same input always produces the same output, no side effects
- **Synchronous** - no promises, no async code
- **String-to-string** - takes the full document text, returns the full document text

```ts
const collapseTripleNewlines: TokenZapPlugin = (text) =>
  text.replace(/\n{3,}/g, "\n\n");

tokenZap(myText, { plugins: [collapseTripleNewlines] });
```

Errors thrown inside a plugin are not caught by TokenZap and will propagate to the caller, consistent with TokenZap's deterministic, no-hidden-behavior design.
