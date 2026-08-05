import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("trimExtraSpaces", () => {
  it("collapses multiple spaces in plain text", () => {
    expect(tokenZap("hello   world")).toBe("hello world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(tokenZap("  hello world  ")).toBe("hello world");
  });

  it("preserves single newlines in plain text", () => {
    expect(tokenZap("line one\nline two")).toBe("line one\nline two");
  });

  it("collapses 3+ blank lines to one blank line in plain text", () => {
    expect(tokenZap("para one\n\n\n\npara two")).toBe("para one\n\npara two");
  });

  it("removes trailing spaces on lines", () => {
    expect(tokenZap("hello   \nworld   ")).toBe("hello\nworld");
  });
});

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

describe("removeArticles - zone-aware behavior", () => {
  it("removes articles from plain prose", () => {
    expect(tokenZap("The cat sat on a mat.", { removeArticles: true })).toBe(
      "cat sat on mat."
    );
  });

  it("preserves articles inside fenced code blocks", () => {
    const input = `The function below uses the variable:

\`\`\`js
const the = "article";
function a() {
  return the;
}
\`\`\`

Call \`a()\` to get the result.`;

    const expected = `function below uses variable:

\`\`\`js
const the = "article";
function a() {
  return the;
}
\`\`\`

Call \`a()\` to get result.`;

    expect(tokenZap(input, { removeArticles: true })).toBe(expected);
  });

  it("preserves articles inside inline code", () => {
    expect(
      tokenZap("Use the `the` variable for a test.", { removeArticles: true })
    ).toBe("Use `the` variable for test.");
  });

  it("preserves articles inside markdown tables", () => {
    const input = `The table below shows the data:

| Name | The Value |
|------|-----------|
| a    | 100       |
| the  | 200       |

That is the summary.`;

    const expected = `table below shows data:

| Name | The Value |
|------|-----------|
| a    | 100       |
| the  | 200       |

That is summary.`;

    expect(tokenZap(input, { removeArticles: true })).toBe(expected);
  });

  it("removes articles everywhere when preserveCodeBlocks is false", () => {
    expect(
      tokenZap("The code: `the value` and a test.", {
        removeArticles: true,
        preserveCodeBlocks: false,
      })
    ).toBe("code: ` value` and test.");
  });
});

describe("trimExtraSpaces: false", () => {
  it("returns text unchanged when trimExtraSpaces is false", () => {
    expect(tokenZap("hello   world", { trimExtraSpaces: false })).toBe("hello   world");
  });
});

describe("stripDecorative - separator lines", () => {
  it("removes a line of dashes", () => {
    expect(tokenZap("Section One\n-------------------\nSome content here.")).toBe(
      "Section One\nSome content here."
    );
  });

  it("removes a line of equal signs", () => {
    expect(tokenZap("Title\n===================\nBody text here.")).toBe(
      "Title\nBody text here."
    );
  });

  it("removes a line of asterisks", () => {
    expect(tokenZap("Header\n***************\nContent below.")).toBe(
      "Header\nContent below."
    );
  });

  it("removes a line of underscores", () => {
    expect(tokenZap("Section\n___________\nMore text.")).toBe(
      "Section\nMore text."
    );
  });

  it("removes multiple decorator lines of different types", () => {
    expect(tokenZap("A\n---\nB\n===\nC")).toBe("A\nB\nC");
  });

  it("does not remove a line containing real words", () => {
    expect(tokenZap("some --- real content ---")).toBe("some --- real content ---");
  });

  it("does not remove a short decorator under 3 characters", () => {
    expect(tokenZap("Title\n--\nBody")).toBe("Title\n--\nBody");
  });

  it("handles empty string without error", () => {
    expect(tokenZap("")).toBe("");
  });
});

describe("stripDecorative - blank line collapsing", () => {
  it("collapses 3+ blank lines into one blank line", () => {
    expect(
      tokenZap("Para one\n\n\n\nPara two", { trimExtraSpaces: false })
    ).toBe("Para one\n\nPara two");
  });

  it("collapses 5 blank lines into one blank line", () => {
    expect(
      tokenZap("Top\n\n\n\n\n\nBottom", { trimExtraSpaces: false })
    ).toBe("Top\n\nBottom");
  });

  it("leaves a single blank line unchanged when trimExtraSpaces is off", () => {
    expect(tokenZap("A\n\nB", { trimExtraSpaces: false })).toBe("A\n\nB");
  });
});

describe("stripDecorative - zone awareness", () => {
  it("removes decorators outside code blocks and preserves content inside", () => {
    const input = `Intro text here.

-------------------

\`\`\`js
// separator inside code: -------------------
const x = 1;
\`\`\`

===================

Closing text here.`;

    const expected = `Intro text here.

\`\`\`js
// separator inside code: -------------------
const x = 1;
\`\`\`

Closing text here.`;

    expect(tokenZap(input)).toBe(expected);
  });

  it("removes decorators outside tables and preserves table separator row", () => {
    const input = `Report output:

-------------------

| Name  | Score |
|-------|-------|
| Alice |    95 |

===================

End of report.`;

    const expected = `Report output:

| Name  | Score |
|-------|-------|
| Alice |    95 |

End of report.`;

    expect(tokenZap(input)).toBe(expected);
  });

  it("removes decorators inside code blocks when preserveCodeBlocks is false", () => {
    expect(
      tokenZap("Prose.\n\n```\n---\ncode\n```\n\n===\n\nMore prose.", {
        preserveCodeBlocks: false,
      })
    ).toBe("Prose.\n\n```\ncode\n```\n\nMore prose.");
  });
});

describe("stripDecorative: false", () => {
  it("leaves decorative lines untouched when stripDecorative is false", () => {
    expect(
      tokenZap("Title\n-------------------\nBody.", { stripDecorative: false })
    ).toBe("Title\n-------------------\nBody.");
  });
});
