import { tokenZap } from "./index.js";
import type { TokenZapOptions } from "./types.js";

export type ZapOptions = Omit<TokenZapOptions, "report">;

type TaggedTemplate = (strings: TemplateStringsArray, ...values: unknown[]) => string;

export interface ZapFunction extends TaggedTemplate {
  with(options: ZapOptions): TaggedTemplate;
}

/**
 * Converts an interpolated template value into a string before it is passed
 * through tokenZap. null and undefined become empty strings so optional
 * values do not leak the literal text "null" or "undefined" into prompts.
 * Objects and arrays are JSON-stringified, falling back to String(value)
 * if serialization fails (for example, circular references).
 */
function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) {
      return serialized;
    }
  } catch {
    // Falls through to String(value), e.g. circular references.
  }

  return String(value);
}

function createZap(options: ZapOptions): TaggedTemplate {
  return function zapTemplate(strings: TemplateStringsArray, ...values: unknown[]): string {
    let result = strings[0];

    for (let i = 0; i < values.length; i++) {
      const cleanedValue = tokenZap(stringifyValue(values[i]), options);
      result += cleanedValue + strings[i + 1];
    }

    return result;
  };
}

/**
 * Tagged template literal that optimizes only the interpolated values in a
 * template string, leaving the static template text untouched.
 *
 * Usage: zap`Analyze this: ${rawData}`
 *
 * For non-default options, use zap.with(options)`...` instead.
 */
export const zap: ZapFunction = Object.assign(createZap({}), {
  with(options: ZapOptions): TaggedTemplate {
    return createZap(options);
  },
});
