import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";

export function tokenZap(text, options = {}) {
  const {
    removeArticles = false,
    trimExtraSpaces = true,
    preserveCodeBlocks = true,
  } = options;

  if (removeArticles) {
    text = rmArticles(text);
  }

  if (trimExtraSpaces) {
    text = trimSpaces(text, preserveCodeBlocks);
  }

  return text;
}
