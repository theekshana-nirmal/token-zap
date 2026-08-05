import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { stripDecorative as stripDeco } from "./utils/stripDecorative.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";
import type { TokenZapOptions } from "./types.js";

export type { TokenZapOptions };

/**
 * Pipeline order rationale:
 *   1. removeArticles  - content-level removal, runs on original structure
 *   2. stripDecorative - removes whole lines and excess blank lines
 *   3. trimExtraSpaces - collapses inline spaces and trailing whitespace last,
 *                        cleaning up any gaps left by the previous two steps
 */
export function tokenZap(text: string, options: TokenZapOptions = {}): string {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
    stripDecorative = true,
  } = options;

  if (removeArticles) {
    text = rmArticles(text, preserveCodeBlocks);
  }

  if (stripDecorative) {
    text = stripDeco(text, preserveCodeBlocks);
  }

  if (trimExtraSpaces) {
    text = trimSpaces(text, preserveCodeBlocks);
  }

  return text;
}
