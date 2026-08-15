import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { stripDecorative as stripDeco } from "./utils/stripDecorative.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";
import { sanitizeUnicode as sanitize } from "./utils/sanitizeUnicode.js";
import { normalizeTypography as normalizeTypo } from "./utils/normalizeTypography.js";
import type { TokenZapOptions } from "./types.js";

export type { TokenZapOptions };

/**
 * Pipeline order rationale:
 *   1. sanitizeUnicode      - removes invisible characters first (always safe)
 *   2. normalizeTypography  - converts smart quotes/dashes (opt-in, style change)
 *   3. removeArticles       - content-level removal, runs on clean structure
 *   4. stripDecorative      - removes whole lines and excess blank lines
 *   5. trimExtraSpaces      - collapses inline spaces and trailing whitespace last,
 *                             cleaning up any gaps left by previous steps
 */
export function tokenZap(text: string, options: TokenZapOptions = {}): string {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
    stripDecorative = true,
    sanitizeUnicode = true,
    normalizeTypography = false,
  } = options;

  if (sanitizeUnicode) {
    text = sanitize(text);
  }

  if (normalizeTypography) {
    text = normalizeTypo(text);
  }

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
