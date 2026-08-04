import { tokenZap } from "../index.js";

let passed = 0;
let failed = 0;

function assert(label: string, actual: string, expected: string): void {
  if (actual === expected) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log("\ntrimExtraSpaces");

assert("collapses multiple spaces in plain text", tokenZap("hello   world"), "hello world");
assert("trims leading and trailing whitespace", tokenZap("  hello world  "), "hello world");
assert("preserves single newlines in plain text", tokenZap("line one\nline two"), "line one\nline two");
assert("collapses 3+ blank lines to 2 in plain text", tokenZap("para one\n\n\n\npara two"), "para one\n\npara two");
assert("removes trailing spaces on lines", tokenZap("hello   \nworld   "), "hello\nworld");

console.log("\npreserveCodeBlocks — fenced code blocks");

const fencedInput = `Fix this function:

\`\`\`js
function   add( a,  b ) {
    return   a + b;
}
\`\`\`

It has   extra spaces in prose.`;

const fencedExpected = `Fix this function:

\`\`\`js
function   add( a,  b ) {
    return   a + b;
}
\`\`\`

It has extra spaces in prose.`;

assert("preserves indentation inside fenced code block", tokenZap(fencedInput), fencedExpected);
assert(
  "collapses spaces in prose around fenced block",
  tokenZap("before   block\n\n```\ncode  here\n```\n\nafter   block"),
  "before block\n\n```\ncode  here\n```\n\nafter block"
);

console.log("\npreserveCodeBlocks — inline code");

assert("preserves spaces inside inline code", tokenZap("call the   `my   function()` method"), "call the `my   function()` method");
assert("collapses spaces in prose around inline code", tokenZap("use   `fn(  )` for   this"), "use `fn(  )` for this");

console.log("\npreserveCodeBlocks — markdown tables");

const tableInput = `See the results below:

| Name    |   Score |
|---------|---------|
| Alice   |      95 |
| Bob     |      87 |

That is   the full   table.`;

const tableExpected = `See the results below:

| Name    |   Score |
|---------|---------|
| Alice   |      95 |
| Bob     |      87 |

That is the full table.`;

assert("preserves table column spacing", tokenZap(tableInput), tableExpected);

console.log("\npreserveCodeBlocks: false");

assert(
  "collapses all spaces when preserveCodeBlocks is false",
  tokenZap("hello   ```code  block```   world", { preserveCodeBlocks: false }),
  "hello ```code block``` world"
);

console.log("\nremoveArticles — zone-aware behavior");

assert(
  "removes articles from plain prose",
  tokenZap("The cat sat on a mat.", { removeArticles: true }),
  "cat sat on mat."
);

const codeWithArticles = `The function below uses the variable:

\`\`\`js
const the = "article";
function a() {
  return the;
}
\`\`\`

Call \`a()\` to get the result.`;

const codeExpected = `function below uses variable:

\`\`\`js
const the = "article";
function a() {
  return the;
}
\`\`\`

Call \`a()\` to get result.`;

assert(
  "preserves articles inside fenced code blocks",
  tokenZap(codeWithArticles, { removeArticles: true }),
  codeExpected
);

assert(
  "preserves articles inside inline code",
  tokenZap("Use the `the` variable for a test.", { removeArticles: true }),
  "Use `the` variable for test."
);

const tableWithArticles = `The table below shows the data:

| Name | The Value |
|------|-----------|
| a    | 100       |
| the  | 200       |

That is the summary.`;

const articlesTableExpected = `table below shows data:

| Name | The Value |
|------|-----------|
| a    | 100       |
| the  | 200       |

That is summary.`;

assert(
  "preserves articles inside markdown tables",
  tokenZap(tableWithArticles, { removeArticles: true }),
  articlesTableExpected
);

assert(
  "removes articles everywhere when preserveCodeBlocks is false",
  tokenZap("The code: `the value` and a test.", { removeArticles: true, preserveCodeBlocks: false }),
  "code: ` value` and test."
);

console.log("\ntrimExtraSpaces: false");

assert("returns text unchanged when trimExtraSpaces is false", tokenZap("hello   world", { trimExtraSpaces: false }), "hello   world");

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
