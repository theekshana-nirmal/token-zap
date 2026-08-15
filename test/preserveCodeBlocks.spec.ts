import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("preserveCodeBlocks - fenced code blocks", () => {
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

  it("preserves indentation inside fenced code block", () => {
    expect(tokenZap(fencedInput)).toBe(fencedExpected);
  });

  it("collapses spaces in prose around fenced block", () => {
    expect(
      tokenZap("before   block\n\n```\ncode  here\n```\n\nafter   block")
    ).toBe("before block\n\n```\ncode  here\n```\n\nafter block");
  });
});

describe("preserveCodeBlocks - inline code", () => {
  it("preserves spaces inside inline code", () => {
    expect(tokenZap("call the   `my   function()` method")).toBe(
      "call the `my   function()` method"
    );
  });

  it("collapses spaces in prose around inline code", () => {
    expect(tokenZap("use   `fn(  )` for   this")).toBe("use `fn(  )` for this");
  });
});

describe("preserveCodeBlocks - markdown tables", () => {
  it("preserves table column spacing", () => {
    const input = `See the results below:

| Name    |   Score |
|---------|---------|
| Alice   |      95 |
| Bob     |      87 |

That is   the full   table.`;

    const expected = `See the results below:

| Name    |   Score |
|---------|---------|
| Alice   |      95 |
| Bob     |      87 |

That is the full table.`;

    expect(tokenZap(input)).toBe(expected);
  });
});

describe("preserveCodeBlocks: false", () => {
  it("collapses all spaces when preserveCodeBlocks is false", () => {
    expect(
      tokenZap("hello   ```code  block```   world", { preserveCodeBlocks: false })
    ).toBe("hello ```code block``` world");
  });
});
