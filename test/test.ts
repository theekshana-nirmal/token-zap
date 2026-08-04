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

console.log("\nremoveArticles + preserveCodeBlocks interaction");

const mixedInput = `The   function below is the   best:

\`\`\`js
// The answer
const the = true;
\`\`\`

Use the   result.`;

const mixedExpected = `function below is best:

\`\`\`js
//  answer
const  = true;
\`\`\`

Use result.`;

assert("removeArticles applies to prose but not inside fenced code", tokenZap(mixedInput, { removeArticles: true }), mixedExpected);

console.log("\ntrimExtraSpaces: false");

assert("returns text unchanged when trimExtraSpaces is false", tokenZap("hello   world", { trimExtraSpaces: false }), "hello   world");

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
