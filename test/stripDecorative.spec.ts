import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

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
