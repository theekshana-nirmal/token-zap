import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { stripDecorative as stripDeco } from "./utils/stripDecorative.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";
import { sanitizeUnicode as sanitize } from "./utils/sanitizeUnicode.js";
import { normalizeTypography as normalizeTypo } from "./utils/normalizeTypography.js";
import {
  stripBinaryBlobs as stripBlobs,
  detectBinaryBlobWarnings,
} from "./utils/stripBinaryBlobs.js";
import { runPlugins } from "./utils/runPlugins.js";
import { countTokens } from "./utils/tokenCount.js";
import type { TokenZapOptions, TokenZapResult } from "./types.js";

export type {
  TokenZapOptions,
  TokenZapResult,
  TokenZapStats,
  TokenZapPlugin,
} from "./types.js";

export { zap } from "./zap.js";
export type { ZapOptions } from "./zap.js";

export function tokenZap(
  text: string,
  options?: TokenZapOptions & { report?: false },
): string;
export function tokenZap(
  text: string,
  options: TokenZapOptions & { report: true },
): TokenZapResult;
export function tokenZap(
  text: string,
  options: TokenZapOptions = {},
): string | TokenZapResult {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
    stripDecorative = true,
    sanitizeUnicode = true,
    normalizeTypography = false,
    stripBinaryBlobs = false,
    report = false,
    tokenizer,
    plugins = [],
  } = options;

  let originalTokens = 0;
  let warnings: string[] = [];
  if (report) {
    originalTokens = countTokens(text, tokenizer);
    // Detection runs on the raw input so advisories describe what was passed
    // in, even when stripping later replaces the blobs.
    warnings = detectBinaryBlobWarnings(text, preserveCodeBlocks);
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

  if (stripBinaryBlobs) {
    text = stripBlobs(text, preserveCodeBlocks);
  }

  if (stripDecorative) {
    text = stripDeco(text, preserveCodeBlocks);
  }

  if (trimExtraSpaces) {
    text = trimSpaces(text, preserveCodeBlocks);
  }

  if (plugins.length > 0) {
    text = runPlugins(text, plugins);
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
      warnings,
    };
  }

  return text;
}
