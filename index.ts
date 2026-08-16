import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { stripDecorative as stripDeco } from "./utils/stripDecorative.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";
import { sanitizeUnicode as sanitize } from "./utils/sanitizeUnicode.js";
import { normalizeTypography as normalizeTypo } from "./utils/normalizeTypography.js";
import { countTokens } from "./utils/tokenCount.js";
import type { TokenZapOptions, TokenZapResult } from "./types.js";

export type { TokenZapOptions, TokenZapResult, TokenZapStats } from "./types.js";

export function tokenZap(
  text: string,
  options?: TokenZapOptions & { report?: false }
): string;
export function tokenZap(
  text: string,
  options: TokenZapOptions & { report: true }
): TokenZapResult;
export function tokenZap(
  text: string,
  options: TokenZapOptions = {}
): string | TokenZapResult {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
    stripDecorative = true,
    sanitizeUnicode = true,
    normalizeTypography = false,
    report = false,
    tokenizer,
  } = options;

  let originalTokens = 0;
  if (report) {
    originalTokens = countTokens(text, tokenizer);
  }

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

  if (report) {
    const cleanedTokens = countTokens(text, tokenizer);
    const tokensSaved = originalTokens - cleanedTokens;
    const percentSaved =
      originalTokens > 0
        ? Math.round((tokensSaved / originalTokens) * 100 * 100) / 100
        : 0;

    return {
      output: text,
      stats: {
        originalTokens,
        cleanedTokens,
        tokensSaved,
        percentSaved,
      },
    };
  }

  return text;
}