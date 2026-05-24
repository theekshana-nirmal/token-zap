import { removeArticles as rmArticles } from "./utils/removeArticles.js";
import { trimExtraSpaces as trimSpaces } from "./utils/trimExtraSpaces.js";

export function tokenZap(prompt, options = {}) {
  const { removeArticles = false, trimExtraSpaces = true } = options;

  // Remove articles if the option is enabled
  if (removeArticles) {
    prompt = rmArticles(prompt);
  }

  // Trim extra spaces by default
  if (trimExtraSpaces) {
    prompt = trimSpaces(prompt);
  }

  return prompt;
}
