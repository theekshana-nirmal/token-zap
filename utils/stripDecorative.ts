import { extractZones } from "./extractZones.js";
import { collapseBlankLines } from "./collapseBlankLines.js";

const PLACEHOLDER_MARKER = "\u0000";

/**
 * Matches a line consisting entirely of one repeated decorator character.
 * Requires 3 or more repetitions to avoid removing meaningful short strings
 * like "--" (used in prose and CLI flags).
 *
 * Supported characters: - = * _ ~ + #
 */
const DECORATOR_LINE = /^[ \t]*([-=*_~+#])\1{2,}[ \t]*$/;

/**
 * Removes decorative separator lines and collapses excessive blank lines
 * from prose regions of the input. Protected zones (fenced code blocks,
 * inline code, markdown tables) are masked before transforms run and
 * restored afterward to prevent silent corruption.
 *
 * @param text - The input string.
 * @param preserveCodeBlocks - When true, skips transforms inside protected zones.
 * @returns The cleaned string.
 */
export function stripDecorative(
  text: string,
  preserveCodeBlocks: boolean = true,
): string {
  if (!preserveCodeBlocks) {
    return applyStripDecorative(text);
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

  const cleaned = applyStripDecorative(masked);

  return cleaned.replace(
    new RegExp(`${PLACEHOLDER_MARKER}(\\d+)${PLACEHOLDER_MARKER}`, "g"),
    (_, index: string) => placeholders[Number(index)],
  );
}

/**
 * Removes decorator lines and collapses excessive blank lines from a plain
 * string with no zone awareness. Called after masking is applied.
 */
function applyStripDecorative(text: string): string {
  const lines = text.split("\n");
  const filtered = lines.filter((line) => !DECORATOR_LINE.test(line));
  return collapseBlankLines(filtered.join("\n"));
}
