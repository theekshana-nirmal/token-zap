import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The CLI is an integration surface over the built output: tests spawn
// `node dist/cli.js`, mirroring the CI order (build, then test).
const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
  });
}

describe.skipIf(!existsSync(cliPath))("cli (requires npm run build first)", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "token-zap-cli-"));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeFixture(name: string, content: string): string {
    const path = join(dir, name);
    writeFileSync(path, content, "utf8");
    return path;
  }

  describe("single file processing", () => {
    it("prints cleaned output to stdout and exits 0", () => {
      const file = writeFixture("basic.txt", "Hello    world");

      const result = runCli(file);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("Hello world\n");
      expect(result.stderr).toBe("");
    });

    it("prints warnings for binary blobs to stderr without altering stdout", () => {
      const blob = `data:image/png;base64,${"aB3".repeat(25)}`;
      const file = writeFixture("blob.txt", `x: ${blob} y`);

      const result = runCli(file);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(`x: ${blob} y\n`);
      expect(result.stderr).toBe(
        `${file}: Possible base64 or binary data blob detected (97 characters at index 3).\n`,
      );
    });
  });

  describe("--stats", () => {
    it("prints approximate token savings to stderr", () => {
      const file = writeFixture("stats.txt", "Hello    world");

      const result = runCli("--stats", file);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("Hello world\n");
      expect(result.stderr).toBe(
        `${file}: 4 -> 3 tokens (approximate; saved 1, 25%)\n`,
      );
    });

    it("prints a total line when processing multiple files", () => {
      const a = writeFixture("sa.txt", "AAA   AAA");
      const b = writeFixture("sb.txt", "BBB   BBB");

      const result = runCli("--stats", a, b);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("AAA AAA\nBBB BBB\n");
      expect(result.stderr).toBe(
        `${a}: 3 -> 2 tokens (approximate; saved 1, 33.33%)\n` +
          `${b}: 3 -> 2 tokens (approximate; saved 1, 33.33%)\n` +
          `total: 6 -> 4 tokens (approximate; saved 2, 33.33%)\n`,
      );
    });
  });

  describe("multiple files and patterns", () => {
    it("processes several files in order", () => {
      const a = writeFixture("ma.txt", "One   one");
      const b = writeFixture("mb.txt", "Two   two");

      const result = runCli(a, b);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("One one\nTwo two\n");
    });

    it("expands * wildcard patterns and skips non-matching files", () => {
      // Isolated subdirectory so the pattern only sees these fixtures.
      const globDir = join(dir, "glob");
      mkdirSync(globDir);
      writeFileSync(join(globDir, "ga.txt"), "AAA   AAA", "utf8");
      writeFileSync(join(globDir, "gb.txt"), "BBB   BBB", "utf8");
      writeFileSync(join(globDir, "gc.md"), "CCC   CCC", "utf8");

      const result = runCli(join(globDir, "*.txt"));

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("AAA AAA\nBBB BBB\n");
    });

    it("deduplicates files matched by overlapping patterns", () => {
      const a = writeFixture("dup.txt", "Hello    world");

      const result = runCli(a, join(dir, "dup.txt"));

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("Hello world\n");
    });

    it("exits 1 when a pattern matches nothing", () => {
      const result = runCli(join(dir, "*.nomatch"));

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("no files match");
      expect(result.stdout).toBe("");
    });
  });

  describe("--config", () => {
    it("applies cleaning options from a JSON config file", () => {
      const file = writeFixture("cfg.txt", "The cat sat on a mat.");
      const config = writeFixture("config.json", '{"removeArticles": true}');

      const result = runCli("--config", config, file);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("cat sat on mat.\n");
    });

    it("exits 2 when the config file is missing", () => {
      const file = writeFixture("cfgmissing.txt", "Hello    world");

      const result = runCli("--config", join(dir, "nope.json"), file);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("cannot read config file");
    });

    it("exits 2 when the config file is not valid JSON", () => {
      const file = writeFixture("cfgbad.txt", "Hello    world");
      const config = writeFixture("bad.json", "{not json");

      const result = runCli("--config", config, file);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("not valid JSON");
    });

    it("exits 2 when the config contains an unsupported option", () => {
      const file = writeFixture("cfgrep.txt", "Hello    world");
      const config = writeFixture("report.json", '{"report": true}');

      const result = runCli("--config", config, file);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('unsupported option "report"');
    });
  });

  describe("usage and errors", () => {
    it("prints usage and exits 2 when no files are given", () => {
      const result = runCli();

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("no input files given");
      expect(result.stderr).toContain("Usage: token-zap");
    });

    it("exits 2 for unknown flags", () => {
      const result = runCli("--bogus", "some.txt");

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("Usage: token-zap");
    });

    it("exits 1 when an input file does not exist", () => {
      const result = runCli(join(dir, "missing.txt"));

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("cannot read");
      expect(result.stdout).toBe("");
    });

    it("prints help to stdout with --help", () => {
      const result = runCli("--help");

      expect(result.status).toBe(0);
      expect(result.stdout.trimStart().startsWith("Usage: token-zap")).toBe(
        true,
      );
    });

    it("prints the package version with --version", () => {
      const result = runCli("--version");

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/^\d+\.\d+\.\d+\r?\n$/);
    });
  });
});
