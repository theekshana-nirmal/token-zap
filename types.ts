export interface TokenZapOptions {
  removeArticles?: boolean;
  trimExtraSpaces?: boolean;
  preserveCodeBlocks?: boolean;
  stripDecorative?: boolean;
  sanitizeUnicode?: boolean;
  normalizeTypography?: boolean;
  report?: boolean;
  tokenizer?: (text: string) => number;
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
}