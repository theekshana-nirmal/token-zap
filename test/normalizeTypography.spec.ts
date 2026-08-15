import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("normalizeTypography", () => {
  it("is disabled by default", () => {
    const input = "\u201CHello\u201D and \u2018world\u2019";
    const result = tokenZap(input, { trimExtraSpaces: false });
    expect(result).toBe(input);
  });

  it("converts smart single quotes to apostrophe", () => {
    const input = "\u2018Hello\u2019 and \u2018world\u2019";
    const expected = "'Hello' and 'world'";
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("converts smart double quotes to straight quotes", () => {
    const input = "\u201CHello\u201D and \u201Cworld\u201D";
    const expected = '"Hello" and "world"';
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("converts em dash to double hyphen", () => {
    const input = "Hello\u2014world";
    const expected = "Hello--world";
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("converts en dash to single hyphen", () => {
    const input = "2020\u20132021";
    const expected = "2020-2021";
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("converts ellipsis character to three dots", () => {
    const input = "Wait\u2026";
    const expected = "Wait...";
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("handles mixed typographic characters", () => {
    const input = "\u201CIt\u2019s 2020\u20132021,\u201D she said\u2014and waited\u2026";
    const expected = "\"It's 2020-2021,\" she said--and waited...";
    expect(tokenZap(input, { normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });

  it("works together with sanitizeUnicode", () => {
    const input = "\uFEFF\u201CHello\u200B world\u201D\u2014test\u2026";
    const expected = '"Hello world"--test...';
    expect(tokenZap(input, { sanitizeUnicode: true, normalizeTypography: true, trimExtraSpaces: false })).toBe(expected);
  });
});
