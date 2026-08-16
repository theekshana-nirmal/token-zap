export function countTokens(
  text: string,
  customTokenizer?: (text: string) => number
): number {
  if (customTokenizer) {
    return customTokenizer(text);
  }

  throw new Error(
    "Token counting requires a tokenizer function.\n\n" +
      "Install a tokenizer package matching your LLM:\n" +
      "  • OpenAI (GPT-4, GPT-3.5): npm install gpt-tokenizer\n" +
      "  • Anthropic (Claude): npm install @anthropic-ai/tokenizer\n" +
      "  • Meta (LLaMA 3): npm install llama3-tokenizer-js\n" +
      "  • Mistral: npm install @mistralai/tokenizer-js\n\n" +
      "Then pass it to TokenZap:\n" +
      "  import { encode } from 'gpt-tokenizer';\n" +
      "  tokenZap(text, { report: true, tokenizer: (t) => encode(t).length })\n\n" +
      "Or use a quick estimator:\n" +
      "  tokenZap(text, { report: true, tokenizer: (t) => Math.ceil(t.length / 4) })"
  );
}