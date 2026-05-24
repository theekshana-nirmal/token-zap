/**
 * Trims extra spaces and new line characters from the input string, and also removes leading and trailing spaces.
 *
 * @param {string} prompt - The input string from which to trim extra spaces and new line characters.
 * @returns {string} - The cleaned string with extra spaces, new line characters removed, and leading/trailing spaces trimmed.
 */
export function trimExtraSpaces(prompt) {
  const cleanPrompt = prompt.replace(/\s+/g, " ").trim();
  return cleanPrompt;
}
