/**
 * Collapses runs of 3 or more consecutive newlines into exactly two,
 * producing a single blank line between paragraphs.
 */
export function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}
