# zapJson Guide

TokenZap v1.7.0+ includes `zapJson`, a standalone utility for cleaning structured data before it is serialized into a prompt.

Developers frequently pass raw API responses or database records straight into prompts. `JSON.stringify()` removes whitespace but keeps null values, empty strings, empty arrays, and empty objects — all of which consume tokens while providing no useful signal to the model. `zapJson` removes them recursively before serialization.

## Quick Start

```ts
import { zapJson } from "@thee-nix/token-zap";

const apiResponse = {
  id: 123,
  name: "report",
  description: null,
  flags: { verbose: false, quiet: false, trace: null },
  pages: [
    { number: 1, body: "text", footnote: null, links: [] },
    { number: 2, body: "", attachment: { data: null } },
  ],
  cache: {},
};

const prompt = JSON.stringify(zapJson(apiResponse));
// {"id":123,"name":"report","flags":{"verbose":false,"quiet":false},"pages":[{"number":1,"body":"text"},{"number":2}]}
```

The raw payload serializes to roughly 230 characters; the cleaned one to 118 — about half the tokens, with no information the model could act on removed.

## Removal rules

Applied at every depth:

| Removed                     | Kept                                        |
| --------------------------- | ------------------------------------------- |
| `null` and `undefined`      | `0`, `false`, `NaN`                         |
| empty strings (`""` only)   | whitespace-only strings (`" "` is kept)     |
| empty arrays (`[]`)         | arrays with at least one kept item          |
| empty plain objects (`{}`)  | plain objects with at least one kept key    |

Containers are removed when they are empty **after** cleaning, so nesting emptiness collapses upward: `{ meta: { empty: null } }` disappears entirely.

## Behavior details

- **Not a text transform.** `zapJson` operates on structured data before stringification; it is not part of the `tokenZap()` pipeline. Combine it with `tokenZap()`/`zap` on the serialized string for maximum savings.
- **Pure.** Plain objects and arrays are rebuilt into new containers; the input is never mutated. Non-plain objects (`Date`, `Map`, class instances) are passed through by reference untouched.
- **Circular references are safe.** A cycle is detected and that branch is dropped rather than throwing — polluted payloads cannot crash the call. Shared, non-circular references are kept in every position.
- **Array indexes shift.** Removing items from arrays renumbers them. This is fine for prompt data; do not use `zapJson` on positional data where indexes are meaningful.

## Safety caveat

`zapJson` is opt-in and **potentially unsafe when a downstream system relies on the presence of `null` versus a missing key or shorter array** — the utility erases that distinction by design. Use it only on data whose destination is a prompt (or another token-sensitive serialization), not on payloads feeding schema-strict consumers such as API validators that distinguish `null` from absent.

## When to use which

- Text prompt → `tokenZap(text)`
- Interpolated values → `` zap`prompt ${value}` ``
- Raw objects/arrays from APIs or databases → `zapJson(data)`, then serialize
- Both: `tokenZap(JSON.stringify(zapJson(data)))`
