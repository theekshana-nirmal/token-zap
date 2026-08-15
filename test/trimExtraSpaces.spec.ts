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

  it("returns text unchanged when trimExtraSpaces is false", () => {
    expect(tokenZap("hello   world", { trimExtraSpaces: false })).toBe("hello   world");
  });
});
