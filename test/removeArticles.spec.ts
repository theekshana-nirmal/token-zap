import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

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
