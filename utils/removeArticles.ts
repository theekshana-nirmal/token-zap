import { extractZones } from "./extractZones.js";

/**
 * Removes English articles ("a", "an", "the") from the input text.
 * When preserveCodeBlocks is true, skips article removal inside fenced code
 * blocks, inline code, and markdown tables.
 *
 * @param text - The input string from which to remove articles.
 * @param preserveCodeBlocks - When true, protects code zones from article removal.
 * @returns The cleaned string with articles removed from prose only.
 */
export function removeArticles(
  text: string,
  preserveCodeBlocks: boolean = true,
): string {
  if (!preserveCodeBlocks) {
    return stripArticles(text);
  }

  const zones = extractZones(text);

  return zones
    .map((zone) =>
      zone.protected ? zone.content : stripArticles(zone.content),
    )
    .join("");
}

/**
 * Strips articles using a global regex replacement.
 */
function stripArticles(text: string): string {
  const regex = /\b(a|an|the)\b/gi;
  return text.replace(regex, "");
}
