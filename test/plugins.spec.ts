import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";
import { runPlugins } from "../utils/runPlugins.js";
import type { TokenZapPlugin } from "../types.js";

describe("runPlugins", () => {
  it("returns text unchanged when no plugins are provided", () => {
    expect(runPlugins("hello world", [])).toBe("hello world");
  });

  it("applies a single plugin", () => {
    const upper: TokenZapPlugin = (text) => text.toUpperCase();
    expect(runPlugins("hello", [upper])).toBe("HELLO");
  });

  it("applies multiple plugins in order", () => {
    const addExclaim: TokenZapPlugin = (text) => `${text}!`;
    const upper: TokenZapPlugin = (text) => text.toUpperCase();
    expect(runPlugins("hello", [addExclaim, upper])).toBe("HELLO!");
  });

  it("handles empty string input", () => {
    const addExclaim: TokenZapPlugin = (text) => `${text}!`;
    expect(runPlugins("", [addExclaim])).toBe("!");
  });
});

describe("tokenZap plugins option", () => {
  it("returns text unchanged when plugins is omitted", () => {
    expect(tokenZap("hello   world")).toBe("hello world");
  });

  it("returns text unchanged when plugins is an empty array", () => {
    expect(tokenZap("hello   world", { plugins: [] })).toBe("hello world");
  });

  it("runs a single custom plugin after built-in transforms", () => {
    const replaceCompanyName: TokenZapPlugin = (text) =>
      text.replace(/Acme Corporation/g, "Acme");

    const result = tokenZap("Acme   Corporation released a product.", {
      plugins: [replaceCompanyName],
    });

    expect(result).toBe("Acme released a product.");
  });

  it("runs multiple plugins in the order provided", () => {
    const censor: TokenZapPlugin = (text) => text.replace(/foo/g, "***");
    const addSuffix: TokenZapPlugin = (text) => `${text} [processed]`;

    const result = tokenZap("foo bar", {
      plugins: [censor, addSuffix],
      trimExtraSpaces: false,
      stripDecorative: false,
      sanitizeUnicode: false,
    });

    expect(result).toBe("*** bar [processed]");
  });

  it("receives text after trimExtraSpaces has already run", () => {
    let seenByPlugin = "";
    const capture: TokenZapPlugin = (text) => {
      seenByPlugin = text;
      return text;
    };

    tokenZap("hello    world", { plugins: [capture] });

    expect(seenByPlugin).toBe("hello world");
  });

  it("does not protect fenced code blocks from plugin transforms", () => {
    const stripAllSpaces: TokenZapPlugin = (text) => text.replace(/ /g, "");
    const text = "Prose here.\n```\nlet x = 5;\n```\n";

    const result = tokenZap(text, {
      plugins: [stripAllSpaces],
      stripDecorative: false,
    });

    expect(result).toBe("Prosehere.\n```\nletx=5;\n```");
  });

  it("reflects plugin output in report stats", () => {
    const shorten: TokenZapPlugin = (text) =>
      text.replace(/hello world/g, "hi");

    const result = tokenZap("hello world", {
      plugins: [shorten],
      report: true,
      tokenizer: (text) => text.length,
    });

    expect(result.output).toBe("hi");
    expect(result.stats.cleanedTokens).toBe(2);
  });

  it("handles empty string input", () => {
    const addMarker: TokenZapPlugin = (text) =>
      text.length === 0 ? "[empty]" : text;
    expect(tokenZap("", { plugins: [addMarker] })).toBe("[empty]");
  });

  it("works with non-Latin script text", () => {
    const wrapBrackets: TokenZapPlugin = (text) => `[${text}]`;
    expect(tokenZap("こんにちは世界", { plugins: [wrapBrackets] })).toBe(
      "[こんにちは世界]",
    );
  });

  it("preserves mixed line endings passed through an identity plugin", () => {
    const identity: TokenZapPlugin = (text) => text;
    const text = "line1\r\nline2\nline3\r\n";

    const result = tokenZap(text, {
      plugins: [identity],
      trimExtraSpaces: false,
      stripDecorative: false,
      sanitizeUnicode: false,
    });

    expect(result).toBe(text);
  });
});
