/**
 * Splits input text into an ordered list of segments, each marked as either
 * protected (code blocks, inline code, tables) or prose (safe to transform).
 *
 * @param {string} text - The full input string.
 * @returns {Array<{ content: string, protected: boolean }>}
 */
export function extractZones(text) {
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    const fenced = findFencedBlock(remaining);
    const table = findTable(remaining);
    const inline = findInlineCode(remaining);

    // Pick whichever protected zone starts earliest
    const candidates = [fenced, table, inline].filter(Boolean);

    if (candidates.length === 0) {
      segments.push({ content: remaining, protected: false });
      break;
    }

    const earliest = candidates.reduce((a, b) => (a.start <= b.start ? a : b));

    if (earliest.start > 0) {
      segments.push({
        content: remaining.slice(0, earliest.start),
        protected: false,
      });
    }

    segments.push({ content: earliest.content, protected: true });
    remaining = remaining.slice(earliest.start + earliest.content.length);
  }

  return segments;
}

/**
 * Finds the first fenced code block (``` or ~~~) in the text.
 *
 * @param {string} text
 * @returns {{ start: number, content: string } | null}
 */
function findFencedBlock(text) {
  // Matches ``` or ~~~ fences, with optional language tag, capturing everything up to closing fence
  const pattern = /^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/m;
  const match = pattern.exec(text);
  if (!match) return null;
  return { start: match.index, content: match[0] };
}

/**
 * Finds the first inline code span (`...`) in the text.
 * Will not match if the position is already inside a fenced block (handled by
 * segment ordering in extractZones — fenced blocks take priority via earliest-start logic).
 *
 * @param {string} text
 * @returns {{ start: number, content: string } | null}
 */
function findInlineCode(text) {
  // Matches a backtick-delimited span that does not cross a newline
  const pattern = /`[^`\n]+`/;
  const match = pattern.exec(text);
  if (!match) return null;
  return { start: match.index, content: match[0] };
}

/**
 * Finds the first markdown table block in the text.
 * A table is detected as a consecutive group of lines where every non-blank
 * line starts with a pipe character.
 *
 * @param {string} text
 * @returns {{ start: number, content: string } | null}
 */
function findTable(text) {
  const lines = text.split("\n");
  let tableStart = -1;
  let tableEnd = -1;
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isPipeLine = line.trimStart().startsWith("|");

    if (isPipeLine && tableStart === -1) {
      tableStart = charOffset;
    }

    if (!isPipeLine && tableStart !== -1) {
      tableEnd = charOffset;
      break;
    }

    charOffset += line.length + 1; // +1 for the \n
  }

  // Table runs to end of text
  if (tableStart !== -1 && tableEnd === -1) {
    tableEnd = text.length;
  }

  if (tableStart === -1) return null;

  return {
    start: tableStart,
    content: text.slice(tableStart, tableEnd),
  };
}
