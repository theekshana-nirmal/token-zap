export interface Zone {
  content: string;
  protected: boolean;
}

interface ZoneMatch {
  start: number;
  content: string;
}

/**
 * Splits input text into an ordered list of segments, each marked as either
 * protected (code blocks, inline code, tables) or prose (safe to transform).
 *
 * @param text - The full input string.
 * @returns An ordered array of zone segments.
 */
export function extractZones(text: string): Zone[] {
  const segments: Zone[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const fenced = findFencedBlock(remaining);
    const table = findTable(remaining);
    const inline = findInlineCode(remaining);

    const candidates: ZoneMatch[] = [fenced, table, inline].filter(
      (c): c is ZoneMatch => c !== null,
    );

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
 * The trailing [ \t]* (not \s*) ensures only horizontal whitespace on the
 * closing fence's own line is consumed, so the newline that separates the
 * fence from following content stays with the surrounding prose zone.
 */
function findFencedBlock(text: string): ZoneMatch | null {
  const pattern = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/m;
  const match = pattern.exec(text);
  if (!match) return null;
  return { start: match.index, content: match[0] };
}

/**
 * Finds the first inline code span (`...`) in the text.
 * Fenced blocks take priority over inline code via earliest-start
 * comparison in extractZones, so this alone will not split fenced content.
 */
function findInlineCode(text: string): ZoneMatch | null {
  const pattern = /`[^`\n]+`/;
  const match = pattern.exec(text);
  if (!match) return null;
  return { start: match.index, content: match[0] };
}

/**
 * Finds the first markdown table block in the text.
 * A table is a consecutive group of lines where every non-blank line
 * starts with a pipe character. The table's content ends at the last
 * pipe line's own content, excluding its trailing newline, so that
 * newline remains part of the following prose zone.
 */
function findTable(text: string): ZoneMatch | null {
  const lines = text.split("\n");
  let tableStart = -1;
  let tableEnd = -1;
  let lastPipeLineEnd = -1;
  let charOffset = 0;

  for (const line of lines) {
    const isPipeLine = line.trimStart().startsWith("|");

    if (isPipeLine) {
      if (tableStart === -1) {
        tableStart = charOffset;
      }
      lastPipeLineEnd = charOffset + line.length;
    } else if (tableStart !== -1) {
      tableEnd = lastPipeLineEnd;
      break;
    }

    charOffset += line.length + 1;
  }

  if (tableStart !== -1 && tableEnd === -1) {
    tableEnd = lastPipeLineEnd;
  }

  if (tableStart === -1) return null;

  return {
    start: tableStart,
    content: text.slice(tableStart, tableEnd),
  };
}
