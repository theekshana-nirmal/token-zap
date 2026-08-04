import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";
import type { TokenZapOptions } from "./types.js";

export type { TokenZapOptions };

export function tokenZap(text: string, options: TokenZapOptions = {}): string {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
  } = options;

  if (removeArticles) {
    text = rmArticles(text, preserveCodeBlocks);
  }

  if (trimExtraSpaces) {
    text = trimSpaces(text, preserveCodeBlocks);
  }

  return text;
}
