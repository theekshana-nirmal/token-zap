import type { TokenZapPlugin } from "../types.js";

/**
 * Runs an ordered list of user-supplied plugins over the text, piping each
 * plugin's output into the next. Plugins run after all built-in transforms
 * have completed, so protected zones (code blocks, tables) have already
 * been restored to their original content and are not masked for plugins.
 *
 * @param text - The text to process.
 * @param plugins - Ordered list of pure string-to-string plugin functions.
 * @returns The text after all plugins have run in sequence.
 */
export function runPlugins(text: string, plugins: TokenZapPlugin[]): string {
  return plugins.reduce((current, plugin) => plugin(current), text);
}
