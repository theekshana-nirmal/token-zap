import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("tokenAnalytics", () => {
  const simpleTokenizer = (text: string) => Math.ceil(text.length / 4);

  describe("report: true with custom tokenizer", () => {
    it("returns TokenZapResult with stats", () => {
      const input = "Hello    world";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result).toHaveProperty("output");
      expect(result).toHaveProperty("stats");
      expect(result.stats).toHaveProperty("originalTokens");
      expect(result.stats).toHaveProperty("cleanedTokens");
      expect(result.stats).toHaveProperty("tokensSaved");
      expect(result.stats).toHaveProperty("percentSaved");
    });

    it("calculates token savings correctly with trimExtraSpaces", () => {
      const input = "Hello    world    test";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        trimExtraSpaces: true,
      });

      expect(result.output).toBe("Hello world test");
      expect(result.stats.originalTokens).toBe(6);
      expect(result.stats.cleanedTokens).toBe(4);
      expect(result.stats.tokensSaved).toBe(2);
      expect(result.stats.percentSaved).toBe(33.33);
    });

    it("calculates zero savings when text is already clean", () => {
      const input = "Hello world";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.output).toBe("Hello world");
      expect(result.stats.originalTokens).toBe(3);
      expect(result.stats.cleanedTokens).toBe(3);
      expect(result.stats.tokensSaved).toBe(0);
      expect(result.stats.percentSaved).toBe(0);
    });

    it("handles empty string", () => {
      const result = tokenZap("", {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.output).toBe("");
      expect(result.stats.originalTokens).toBe(0);
      expect(result.stats.cleanedTokens).toBe(0);
      expect(result.stats.tokensSaved).toBe(0);
      expect(result.stats.percentSaved).toBe(0);
    });

    it("works with removeArticles option", () => {
      const input = "The quick brown fox";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        removeArticles: true,
      });

      expect(result.output).toBe("quick brown fox");
      expect(result.stats.originalTokens).toBe(5);
      expect(result.stats.cleanedTokens).toBe(4);
      expect(result.stats.tokensSaved).toBe(1);
    });

    it("works with stripDecorative option", () => {
      const input = "Title\n---\nContent";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        stripDecorative: true,
      });

      expect(result.output).toBe("Title\nContent");
      expect(result.stats.tokensSaved).toBeGreaterThan(0);
    });

    it("works with sanitizeUnicode option", () => {
      const input = "Hello\u200Bworld";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        sanitizeUnicode: true,
      });

      expect(result.output).toBe("Helloworld");
      expect(result.stats.originalTokens).toBe(3);
      expect(result.stats.cleanedTokens).toBe(3);
    });

    it("rounds percentSaved to 2 decimal places", () => {
      // 22 chars original, 16 chars cleaned = 27.27...% saved, rounds to 27.27
      const input = "Hello    world    test";
      const result = tokenZap(input, {
        report: true,
        tokenizer: (text) => text.length,
        trimExtraSpaces: true,
      });

      expect(result.stats.percentSaved).toBe(27.27);
    });
  });

  describe("report: false (default behavior)", () => {
    it("returns string when report is false", () => {
      const input = "Hello    world";
      const result = tokenZap(input, { report: false });

      expect(typeof result).toBe("string");
      expect(result).toBe("Hello world");
    });

    it("returns string when report is undefined", () => {
      const input = "Hello    world";
      const result = tokenZap(input);

      expect(typeof result).toBe("string");
      expect(result).toBe("Hello world");
    });
  });

  describe("custom tokenizer variations", () => {
    it("accepts simple character-based tokenizer", () => {
      const charTokenizer = (text: string) => text.length;
      const input = "Hello world";
      const result = tokenZap(input, {
        report: true,
        tokenizer: charTokenizer,
      });

      expect(result.stats.originalTokens).toBe(11);
      expect(result.stats.cleanedTokens).toBe(11);
    });

    it("accepts word-based tokenizer", () => {
      const wordTokenizer = (text: string) =>
        text.split(/\s+/).filter(Boolean).length;
      const input = "Hello    world    test";
      const result = tokenZap(input, {
        report: true,
        tokenizer: wordTokenizer,
        trimExtraSpaces: true,
      });

      expect(result.stats.originalTokens).toBe(3);
      expect(result.stats.cleanedTokens).toBe(3);
    });

    it("throws error when report: true but no tokenizer and js-tiktoken not installed", () => {
      const input = "Hello world";

      expect(() => {
        tokenZap(input, { report: true });
      }).toThrow(/Token counting requires a tokenizer function/);
    });
  });

  describe("edge cases", () => {
    it("handles 100% token reduction", () => {
      const input = "   \n\n\n   ";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        trimExtraSpaces: true,
      });

      expect(result.output).toBe("");
      expect(result.stats.percentSaved).toBe(100);
    });

    it("handles text with all cleaning options enabled", () => {
      const input =
        "The quick   brown\u200Bfox\n---\n\n\njumps over a lazy dog";
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        trimExtraSpaces: true,
        removeArticles: true,
        stripDecorative: true,
        sanitizeUnicode: true,
      });

      expect(result.stats.tokensSaved).toBeGreaterThan(0);
      expect(result.stats.percentSaved).toBeGreaterThan(0);
    });
  });
});
