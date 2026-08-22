export type TokenZapPlugin = (text: string) => string;

export interface TokenZapOptions {
  removeArticles?: boolean;
  trimExtraSpaces?: boolean;
  preserveCodeBlocks?: boolean;
  stripDecorative?: boolean;
  sanitizeUnicode?: boolean;
  normalizeTypography?: boolean;
  stripBinaryBlobs?: boolean;
  report?: boolean;
  tokenizer?: (text: string) => number;
  plugins?: TokenZapPlugin[];
}

export interface TokenZapStats {
  originalTokens: number;
  cleanedTokens: number;
  tokensSaved: number;
  percentSaved: number;
}

export interface TokenZapResult {
  output: string;
  stats: TokenZapStats;
  /**
   * Non-fatal advisories about the input, in document order. Currently
   * populated with one entry per detected base64/binary data blob.
   * Empty when nothing suspicious was found.
   */
  warnings: string[];
}
