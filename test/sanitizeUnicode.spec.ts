import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("sanitizeUnicode", () => {
  it("removes zero-width space", () => {
    const input = "hello\u200Bworld";
    const expected = "helloworld";
    expect(tokenZap(input)).toBe(expected);
  });

  it("removes zero-width non-joiner and joiner", () => {
    const input = "test\u200Cword\u200Dhere";
    const expected = "testwordhere";
    expect(tokenZap(input)).toBe(expected);
  });

  it("removes byte order mark (BOM)", () => {
    const input = "\uFEFFHello World";
    const expected = "Hello World";
    expect(tokenZap(input)).toBe(expected);
  });

  it("converts non-breaking space to regular space", () => {
    const input = "hello\u00A0world";
    const expected = "hello world";
    expect(tokenZap(input)).toBe(expected);
  });

  it("removes soft hyphen", () => {
    const input = "re\u00ADsponsible";
    const expected = "responsible";
    expect(tokenZap(input)).toBe(expected);
  });

  it("removes LTR and RTL marks", () => {
    const input = "\u200EHello\u200F World";
    const expected = "Hello World";
    expect(tokenZap(input)).toBe(expected);
  });

  it("applies NFC normalization", () => {
    const input = "café";
    const nfd = input.normalize("NFD");
    const result = tokenZap(nfd);
    expect(result).toBe("café");
    expect(result.length).toBeLessThan(nfd.length);
  });

  it("can be disabled via option", () => {
    const input = "hello\u200Bworld";
    const result = tokenZap(input, { sanitizeUnicode: false, trimExtraSpaces: false });
    expect(result).toBe("hello\u200Bworld");
  });

  it("handles multiple invisible characters in one string", () => {
    const input = "\uFEFFhello\u200B\u00A0world\u200C\u200Dtest\u00AD";
    const expected = "hello worldtest";
    expect(tokenZap(input)).toBe(expected);
  });
});
