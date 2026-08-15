/**
 * Converts smart quotes, em dashes, and other typographic characters
 * to their plain ASCII equivalents.
 *
 * This is OPT-IN (default: false) because it changes visual style.
 * Use when you need maximum compatibility or when typographic characters
 * waste tokens unnecessarily in your model.
 *
 * Conversions:
 * - Smart single quotes (U+2018, U+2019) -> apostrophe (')
 * - Smart double quotes (U+201C, U+201D) -> straight quotes (")
 * - Em dash (U+2014) -> double hyphen (--)
 * - En dash (U+2013) -> single hyphen (-)
 * - Horizontal ellipsis (U+2026) -> three dots (...)
 *
 * @param text - The input string.
 * @returns Text with typographic characters replaced by ASCII equivalents.
 */
export function normalizeTypography(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...');
}
