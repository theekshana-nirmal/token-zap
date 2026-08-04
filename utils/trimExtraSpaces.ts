import { extractZones } from "./extractZones.js";

const PLACEHOLDER_MARKER = "\u0000";

/**
 * Trims extra spaces from prose in the input, while leaving protected zones
 * (fenced code blocks, inline code, markdown tables) completely untouched.
 *
 * Protected zones are masked with placeholder tokens before space-collapsing
 * logic runs, so line-boundary regex operations treat the document as one
 * continuous string instead of being tripped up by segment boundaries.
 *
 * @param text - The input string.
 * @param preserveCodeBlocks - When true, skips trimming inside protected zones.
 * @returns The cleaned string.
 */
export function trimExtraSpaces(text: string, preserveCodeBlocks: boolean = true): string {
  if (!preserveCodeBlocks) {
    return collapseSpaces(text);
  }

  const zones = extractZones(text);
  const placeholders: string[] = [];
  let masked = "";

  for (const zone of zones) {
    if (zone.protected) {
      const token = `${PLACEHOLDER_MARKER}${placeholders.length}${PLACEHOLDER_MARKER}`;
      placeholders.push(zone.content);
      masked += token;
    } else {
      masked += zone.content;
    }
  }

  const cleaned = collapseSpaces(masked);

  return cleaned.replace(
    new RegExp(`${PLACEHOLDER_MARKER}(\\d+)${PLACEHOLDER_MARKER}`, "g"),
    (_, index: string) => placeholders[Number(index)]
  );
}

/**
 * Collapses multiple consecutive spaces into one, removes leading/trailing
 * whitespace, collapses excessive blank lines, and strips trailing
 * whitespace at the end of each line.
 */
function collapseSpaces(text: string): string {
  return text
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}
