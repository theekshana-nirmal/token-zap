import { describe, it, expect } from "vitest";
import { zap } from "../index.js";

describe("zap tagged template", () => {
  it("returns static text unchanged when there are no interpolations", () => {
    expect(zap`Hello   world`).toBe("Hello   world");
  });

  it("cleans a single interpolated value while preserving static text", () => {
    const rawData = "some   data";
    expect(zap`Analyze this: ${rawData}`).toBe("Analyze this: some data");
  });

  it("cleans multiple interpolated values independently", () => {
    const a = "foo   bar";
    const b = "baz    qux";
    expect(zap`${a} and ${b}`).toBe("foo bar and baz qux");
  });

  it("does not clean static template text even if it contains extra spaces", () => {
    const value = "a  b";
    expect(zap`Hello   world: ${value}`).toBe("Hello   world: a b");
  });

  it("converts undefined interpolations to an empty string", () => {
    const value = undefined;
    expect(zap`Value: ${value}`).toBe("Value: ");
  });

  it("converts null interpolations to an empty string", () => {
    const value = null;
    expect(zap`Value: ${value}`).toBe("Value: ");
  });

  it("stringifies number interpolations", () => {
    expect(zap`Count: ${42}`).toBe("Count: 42");
  });

  it("stringifies boolean interpolations", () => {
    expect(zap`Flag: ${true}`).toBe("Flag: true");
  });

  it("stringifies bigint interpolations", () => {
    expect(zap`Big: ${10n}`).toBe("Big: 10");
  });

  it("JSON-stringifies plain object interpolations", () => {
    const obj = { a: 1, b: "two" };
    expect(zap`Data: ${obj}`).toBe('Data: {"a":1,"b":"two"}');
  });

  it("JSON-stringifies array interpolations", () => {
    const arr = [1, 2, 3];
    expect(zap`Data: ${arr}`).toBe("Data: [1,2,3]");
  });

  it("falls back to String(value) for values that cannot be JSON-stringified", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(zap`Data: ${circular}`).toBe("Data: [object Object]");
  });

  it("handles empty string interpolations", () => {
    expect(zap`Value: [${""}]`).toBe("Value: []");
  });

  it("handles an empty template literal", () => {
    expect(zap``).toBe("");
  });

  it("applies custom options via zap.with()", () => {
    const value = "a  b  c";
    const noTrim = zap.with({ trimExtraSpaces: false });
    expect(noTrim`Value: ${value}`).toBe("Value: a  b  c");
  });

  it("zap.with() returns an independent tagged template function", () => {
    const value = "hello   world";
    const withArticlesRemoved = zap.with({ removeArticles: true });
    expect(withArticlesRemoved`Text: ${"the quick fox"}`).toBe(
      "Text: quick fox",
    );
    expect(zap`Text: ${"the quick fox"}`).toBe("Text: the quick fox");
    expect(value).toBe("hello   world");
  });
});
