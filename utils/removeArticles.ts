/**
 * Removes English articles ("a", "an", "the") from the input text.
 * Matching is case-insensitive and restricted to whole words.
 *
 * @param prompt - The input string from which to remove articles.
 * @returns The cleaned string with articles removed.
 */
export function removeArticles(prompt: string): string {
  const regex = /\b(a|an|the)\b/gi;
  return prompt.replace(regex, "");
}
