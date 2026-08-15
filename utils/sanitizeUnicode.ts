/**
 * Removes invisible and zero-width Unicode characters that waste tokens
 * without adding semantic meaning. Applies Unicode NFC normalization.
 *
 * This transform is ALWAYS SAFE and runs by default, as these characters
 * are never semantically meaningful in LLM prompts.
 *
 * Characters removed:
 * - Zero-width space (U+200B)
 * - Zero-width non-joiner (U+200C)
 * - Zero-width joiner (U+200D)
 * - Word joiner (U+2060)
 * - Byte order mark (U+FEFF)
 * - Non-breaking space (U+00A0) - replaced with regular space
 * - Soft hyphen (U+00AD)
 * - Left-to-right mark (U+200E)
 * - Right-to-left mark (U+200F)
 *
 * @param text - The input string.
 * @returns Text with invisible characters removed and NFC normalization applied.
 */
export function sanitizeUnicode(text: string): string {
  let result = text
    .replace(/\u200B/g, '')
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '')
    .replace(/\u2060/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u00AD/g, '')
    .replace(/\u200E/g, '')
    .replace(/\u200F/g, '');

  return result.normalize('NFC');
}
