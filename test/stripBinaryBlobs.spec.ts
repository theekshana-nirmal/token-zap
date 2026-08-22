import { describe, it, expect } from "vitest";
import { tokenZap } from "../index.js";

describe("stripBinaryBlobs", () => {
  const simpleTokenizer = (text: string) => Math.ceil(text.length / 4);

  // 120 chars, mixed case + digit: matches the base64-run heuristic.
  const blob = "aB3".repeat(40);

  // Explicit data URI with a 60-char payload (>= 50 threshold).
  const dataUri = `data:image/png;base64,${"aB3".repeat(20)}`;

  // Legitimate long strings that must NOT be flagged.
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  const sha256Hex =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const sha512Hex =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" +
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  describe("default behavior (detect and warn only)", () => {
    it("does not modify text containing a base64 blob", () => {
      const input = `Here is a blob: ${blob} end.`;

      expect(tokenZap(input)).toBe(input);
    });

    it("does not modify text containing a data URI", () => {
      const input = `Image: ${dataUri} attached.`;

      expect(tokenZap(input)).toBe(input);
    });

    it("returns an empty warnings array for blob-free text", () => {
      const result = tokenZap("Hello world", {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.warnings).toEqual([]);
    });

    it("reports a warning for a detected base64 blob without altering output", () => {
      const input = `Prefix ${blob} suffix.`;
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.output).toBe(input);
      expect(result.warnings).toEqual([
        "Possible base64 or binary data blob detected (120 characters at index 7).",
      ]);
    });

    it("reports a warning for a detected data URI", () => {
      const result = tokenZap(`Image: ${dataUri} attached.`, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.warnings).toEqual([
        "Possible base64 or binary data blob detected (82 characters at index 7).",
      ]);
    });

    it("reports one warning per blob in document order", () => {
      const result = tokenZap(`One ${blob} two ${blob} three.`, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.warnings).toEqual([
        "Possible base64 or binary data blob detected (120 characters at index 4).",
        "Possible base64 or binary data blob detected (120 characters at index 129).",
      ]);
    });

    it("does not warn about blobs inside fenced code blocks", () => {
      const input = `Before\n\`\`\`\n${blob}\n\`\`\`\nAfter`;
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
      });

      expect(result.warnings).toEqual([]);
    });

    it("warns about blobs inside code blocks when preserveCodeBlocks is false", () => {
      const input = `Before\n\`\`\`\n${blob}\n\`\`\`\nAfter`;
      const result = tokenZap(input, {
        report: true,
        tokenizer: simpleTokenizer,
        preserveCodeBlocks: false,
      });

      expect(result.warnings).toEqual([
        "Possible base64 or binary data blob detected (120 characters at index 11).",
      ]);
    });
  });

  describe("stripBinaryBlobs: true", () => {
    it("replaces a raw base64 blob with a placeholder", () => {
      const input = `Here is a blob: ${blob} end.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(
        "Here is a blob: [binary data removed, 120 characters] end.",
      );
    });

    it("replaces a data URI with a placeholder", () => {
      const input = `Image: ${dataUri} attached.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(
        "Image: [binary data removed, 82 characters] attached.",
      );
    });

    it("replaces multiple blobs and keeps surrounding text", () => {
      const input = `A ${blob} and B ${blob} done.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(
        "A [binary data removed, 120 characters] and B [binary data removed, 120 characters] done.",
      );
    });

    it("does not replace UUIDs", () => {
      const input = `User id: ${uuid} confirmed.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace SHA-256 hex digests", () => {
      const input = `Hash: ${sha256Hex} ok.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace long single-case hex strings like SHA-512 digests", () => {
      const input = `Hash: ${sha512Hex} ok.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace long uppercase-and-digit-only runs", () => {
      const upperRun = "AB3".repeat(40);
      const input = `Code: ${upperRun} ok.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace data URIs with payloads shorter than 50 characters", () => {
      const shortUri = `data:image/png;base64,${"aB3".repeat(10)}`;
      const input = `Image: ${shortUri} attached.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace blobs inside fenced code blocks", () => {
      const input = `Before\n\`\`\`\n${blob}\n\`\`\`\nAfter`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace blobs inside inline code", () => {
      const input = `Check \`${blob}\` please.`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("does not replace blobs inside markdown tables", () => {
      const input = `| payload |\n| --- |\n| ${blob} |`;

      expect(tokenZap(input, { stripBinaryBlobs: true })).toBe(input);
    });

    it("replaces blobs inside fenced code blocks when preserveCodeBlocks is false", () => {
      const input = `Before\n\`\`\`\n${blob}\n\`\`\`\nAfter`;

      expect(
        tokenZap(input, { stripBinaryBlobs: true, preserveCodeBlocks: false }),
      ).toBe(
        "Before\n```\n[binary data removed, 120 characters]\n```\nAfter",
      );
    });

    it("handles empty string", () => {
      expect(tokenZap("", { stripBinaryBlobs: true })).toBe("");
    });
  });
});
