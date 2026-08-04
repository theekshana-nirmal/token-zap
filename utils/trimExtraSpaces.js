import { extractZones } from "./extractZones.js";

/**
 * Trims extra spaces from prose segments of the input, while leaving protected
 * zones (fenced code blocks, inline code, markdown tables) completely untouched.
 *
 * @param {string} text - The input string.
 * @param {boolean} preserveCodeBlocks - When true, skips trimming inside protected zones.
 * @returns {string}
 */
export function trimExtraSpaces(text, preserveCodeBlocks = true) {
  if (!preserveCodeBlocks) {
    return collapseSpaces(text);
  }

  const segments = extractZones(text);

  const result = segments
    .map((segment) => {
      if (segment.protected) return segment.content;
      return collapseSpaces(segment.content);
    })
    .join("");

  return result.trim();
}

/**
 * Collapses multiple consecutive spaces into one and removes leading/trailing whitespace.
 * Preserves intentional newlines — only collapses runs of plain spaces (not all whitespace).
 *
 * @param {string} text
 * @returns {string}
 */
function collapseSpaces(text) {
  return text
    .replace(/ +/g, " ") // collapse runs of spaces only (not newlines)
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines down to 2
    .replace(/[ \t]+$/gm, ""); // remove trailing spaces on each line
}
