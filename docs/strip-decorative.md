# stripDecorative

Removes decorative separator lines and collapses excessive blank lines from text before it is sent to an LLM. Decorative lines are visual-only artifacts that carry no semantic meaning and silently inflate token counts.

## Option

| Option            | Type    | Default | Description                                                              |
| ----------------- | ------- | ------- | ------------------------------------------------------------------------ |
| `stripDecorative` | boolean | `true`  | Removes decorator lines and collapses 3+ blank lines into one blank line |

## What Counts as a Decorator Line

A line is treated as decorative if it contains **only** one repeated character from the set `- = * _ ~ + #`, repeated **3 or more times**, with optional surrounding whitespace.

| Line content          | Removed? | Reason                            |
| --------------------- | -------- | --------------------------------- |
| `-------------------` | Yes      | Only dashes, 3+ chars             |
| `===================` | Yes      | Only equal signs, 3+ chars        |
| `***************`     | Yes      | Only asterisks, 3+ chars          |
| `___________`         | Yes      | Only underscores, 3+ chars        |
| `--`                  | No       | Too short (under 3 repetitions)   |
| `some --- content`    | No       | Contains real words               |
| `\|------\|\----\|`   | No       | Inside a protected markdown table |

## Before and After Examples

### Decorative separator lines

**Before:**

```
Section One
-------------------
Some content here.

===================

Another section.
***************
More content.
```

**After:**

```
Section One
Some content here.

Another section.
More content.
```

### Excessive blank lines

**Before:**

```
Paragraph one.




Paragraph two.
```

**After:**

```
Paragraph one.

Paragraph two.
```

### Mixed with a markdown table

The table separator row (`|---|---|`) lives inside a protected zone and is never touched.

**Before:**

```
Report output:

-------------------

| Name  | Score |
|-------|-------|
| Alice |    95 |

===================

End of report.
```

**After:**

```
Report output:

| Name  | Score |
|-------|-------|
| Alice |    95 |

End of report.
```

### Mixed with a fenced code block

Decorators inside code blocks are preserved verbatim.

**Before:**

````
Intro text.

-------------------

```js
// separator inside code: -------------------
const x = 1;
```

===================

Closing text.
````

**After:**

````
Intro text.

```js
// separator inside code: -------------------
const x = 1;
```

Closing text.
````

## Disabling the Option

```ts
import { tokenZap } from "@thee-nix/token-zap";

const result = tokenZap(text, { stripDecorative: false });
```

## Interaction with Other Options

- **`preserveCodeBlocks: false`** - Decorator lines inside fenced code blocks and tables will also be removed.
- **`trimExtraSpaces`** - Runs after `stripDecorative`. Any gaps left by removed lines are further cleaned by space collapsing.
- Both options handle blank line collapsing. Running both is safe and idempotent.
