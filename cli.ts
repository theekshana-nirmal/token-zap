#!/usr/bin/env node

/**
 * TokenZap command-line interface.
 *
 * A thin wrapper around the tokenZap() core API: it reads files, passes their
 * contents through the same pipeline as the library, prints cleaned output to
 * stdout, and keeps diagnostics (warnings, stats) on stderr so stdout stays
 * pipeable.
 *
 * This is the only module in the package that imports Node builtins — the
 * library core remains pure, isomorphic string manipulation.
 */
import { parseArgs } from "node:util";
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import process from "node:process";
import { tokenZap } from "./index.js";
import type { TokenZapOptions } from "./types.js";

/** Exit code for file/IO failures (a CI pipeline treats this as "bad input"). */
const EXIT_FILE_ERROR = 1;

/** Exit code for usage and config errors (bad flags, unreadable config). */
const EXIT_USAGE_ERROR = 2;

/**
 * TokenZap is zero-dependency and tokenizers are user-supplied, so --stats
 * uses a chars/4 approximation. Real counts require a tokenizer in userland.
 */
const approximateTokenizer = (text: string) => Math.ceil(text.length / 4);

/** Cleaning options that may be set from a --config JSON file. */
const CONFIGURABLE_OPTIONS = [
  "removeArticles",
  "trimExtraSpaces",
  "preserveCodeBlocks",
  "stripDecorative",
  "sanitizeUnicode",
  "normalizeTypography",
  "stripBinaryBlobs",
] as const;

const USAGE = `Usage: token-zap [options] <file|pattern> [more files/patterns...]

Cleans prompt files with TokenZap and prints the result to stdout.

Options:
  --stats          Print token savings to stderr (approximate, ~4 chars/token)
  --config <path>  Load cleaning options from a JSON file
  --help           Show this help
  --version        Print the package version

Glob support is limited to * and ? wildcards in the file-name part of each
pattern (for example "prompts/*.txt"); recursive ** patterns are not
supported.

Exit codes: 0 success, 1 file error, 2 usage or config error.
Cleaned output goes to stdout; warnings and stats go to stderr.`;

/**
 * Reads the version from package.json. Resolved relative to this file so it
 * works both from dist/ in the published package and in a git checkout.
 */
function getVersion(): string {
  const raw = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  return (JSON.parse(raw) as { version: string }).version;
}

/**
 * Expands a file argument into concrete paths. Arguments without wildcard
 * metacharacters are returned as-is (the caller reports missing files);
 * arguments with * or ? in the file-name segment are expanded against the
 * (literal) directory part. Dotfiles are only matched by patterns that
 * explicitly start with a dot, matching common shell glob behavior.
 */
function expandPattern(pattern: string): string[] {
  const normalized = pattern.split(sep).join("/");
  if (!/[*?]/.test(normalized)) {
    return [pattern];
  }

  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash === -1 ? "." : normalized.slice(0, lastSlash) || "/";
  const namePattern = normalized.slice(lastSlash + 1);
  const regex = new RegExp(
    "^" +
      namePattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]") +
      "$",
  );

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    throw new Error(`no files match "${pattern}": cannot read directory "${dir}"`);
  }

  const matched = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        regex.test(entry.name) &&
        (namePattern.startsWith(".") || !entry.name.startsWith(".")),
    )
    .map((entry) => join(dir, entry.name))
    .sort();

  if (matched.length === 0) {
    throw new Error(`no files match "${pattern}"`);
  }
  return matched;
}

/**
 * Loads and validates a --config JSON file. Only cleaning options are
 * accepted; `report`, `tokenizer`, and `plugins` are rejected because they
 * only make sense programmatically.
 */
function loadConfig(configPath: string): TokenZapOptions {
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch {
    throw new Error(`cannot read config file "${configPath}"`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `config file "${configPath}" is not valid JSON: ${(error as Error).message}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`config file "${configPath}" must contain a JSON object`);
  }

  const options: TokenZapOptions = {};
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (!CONFIGURABLE_OPTIONS.includes(key as (typeof CONFIGURABLE_OPTIONS)[number])) {
      throw new Error(
        `config file "${configPath}" contains unsupported option "${key}" ` +
          `(allowed: ${CONFIGURABLE_OPTIONS.join(", ")})`,
      );
    }
    if (typeof value !== "boolean") {
      throw new Error(
        `config file "${configPath}" option "${key}" must be a boolean`,
      );
    }
    options[key as (typeof CONFIGURABLE_OPTIONS)[number]] = value;
  }
  return options;
}

function main(): number {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        stats: { type: "boolean" },
        config: { type: "string" },
        help: { type: "boolean" },
        version: { type: "boolean" },
      },
    });
  } catch (error) {
    process.stderr.write(`token-zap: ${(error as Error).message}\n\n${USAGE}\n`);
    return EXIT_USAGE_ERROR;
  }

  const { stats, config, help, version } = args.values;
  const patterns = args.positionals;

  if (help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  if (version) {
    process.stdout.write(`${getVersion()}\n`);
    return 0;
  }

  if (patterns.length === 0) {
    process.stderr.write(
      `token-zap: no input files given.\n\n${USAGE}\n`,
    );
    return EXIT_USAGE_ERROR;
  }

  let configOptions: TokenZapOptions = {};
  if (config !== undefined) {
    try {
      configOptions = loadConfig(config);
    } catch (error) {
      process.stderr.write(`token-zap: ${(error as Error).message}\n`);
      return EXIT_USAGE_ERROR;
    }
  }

  // Dedupe paths reached through overlapping patterns, keeping first-seen order.
  const files: string[] = [];
  for (const pattern of patterns) {
    for (const path of expandPattern(pattern)) {
      if (!files.includes(path)) {
        files.push(path);
      }
    }
  }

  let totalOriginal = 0;
  let totalCleaned = 0;

  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch (error) {
      process.stderr.write(`token-zap: cannot read "${file}": ${(error as Error).message}\n`);
      return EXIT_FILE_ERROR;
    }

    const result = tokenZap(text, {
      ...configOptions,
      report: true,
      tokenizer: approximateTokenizer,
    });

    for (const warning of result.warnings) {
      process.stderr.write(`${file}: ${warning}\n`);
    }

    if (stats) {
      const { originalTokens, cleanedTokens, tokensSaved, percentSaved } =
        result.stats;
      process.stderr.write(
        `${file}: ${originalTokens} -> ${cleanedTokens} tokens (approximate; saved ${tokensSaved}, ${percentSaved}%)\n`,
      );
      totalOriginal += originalTokens;
      totalCleaned += cleanedTokens;
    }

    process.stdout.write(`${result.output}\n`);
  }

  if (stats && files.length > 1) {
    const saved = totalOriginal - totalCleaned;
    const percent =
      totalOriginal > 0
        ? Math.round((saved / totalOriginal) * 100 * 100) / 100
        : 0;
    process.stderr.write(
      `total: ${totalOriginal} -> ${totalCleaned} tokens (approximate; saved ${saved}, ${percent}%)\n`,
    );
  }

  return 0;
}

// exitCode (rather than process.exit) so Node flushes piped stdout first.
process.exitCode = main();
