import { extractZones } from "./extractZones.js";

/**
 * Minimum length for a bare base64-charset run to be considered a data blob.
 * 100 keeps common legitimate strings safe: UUIDs (36 chars with dashes),
 * SHA-256 hex digests (64 chars), and typical API tokens all fall below it.
 */
const MIN_BLOB_LENGTH = 100;

/**
 * Minimum payload length for data-URI base64 payloads. Data URIs carry an
 * explicit `;base64` marker, so they are trusted at a lower threshold than
 * bare runs.
 */
const MIN_DATA_URI_PAYLOAD = 50;

/** Bare run of standard base64 alphabet characters (with optional padding). */
const BASE64_RUN_PATTERN = new RegExp(
  `[A-Za-z0-9+/]{${MIN_BLOB_LENGTH},}={0,2}`,
  "g",
);

/** Explicit base64 data URI, e.g. `data:image/png;base64,iVBORw0...`. */
const DATA_URI_PATTERN = new RegExp(
  `data:[^\\s;,]+;base64,[A-Za-z0-9+/=]{${MIN_DATA_URI_PAYLOAD},}`,
  "g",
);

/** A detected base64-like or binary-looking data blob. */
export interface BinaryBlob {
  /** The matched blob text. */
  content: string;
  /** Index of the blob within the scanned text. */
  index: number;
}

/**
 * Finds candidate binary data blobs in a text segment.
 *
 * Heuristic: a contiguous run of at least MIN_BLOB_LENGTH base64-alphabet
 * characters that mixes lowercase, uppercase, AND digits. The mixed-case and
 * digit requirements filter out long single-case strings such as SHA-512 hex
 * digests (128 lowercase hex chars), which would otherwise match the charset.
 * Explicit `data:<mime>;base64,<payload>` matches are always flagged once the
 * payload reaches MIN_DATA_URI_PAYLOAD characters, regardless of case mix.
 */
function findBlobs(segment: string): BinaryBlob[] {
  const dataUris: BinaryBlob[] = [];
  for (const match of segment.matchAll(DATA_URI_PATTERN)) {
    dataUris.push({ content: match[0], index: match.index });
  }

  const runs: BinaryBlob[] = [];
  for (const match of segment.matchAll(BASE64_RUN_PATTERN)) {
    const run = match[0];
    if (!/[a-z]/.test(run) || !/[A-Z]/.test(run) || !/[0-9]/.test(run)) {
      continue;
    }
    // Skip bare-run matches that sit inside an already-flagged data-URI
    // payload so the same blob is not reported twice.
    const duplicated = dataUris.some(
      (uri) =>
        match.index >= uri.index &&
        match.index < uri.index + uri.content.length,
    );
    if (!duplicated) {
      runs.push({ content: run, index: match.index });
    }
  }

  return [...dataUris, ...runs].sort((a, b) => a.index - b.index);
}

/**
 * Detects base64-like or binary-looking data blobs in the input text.
 * When preserveCodeBlocks is true, only prose zones are scanned — encoded
 * data inside intentional code blocks, inline code, and tables is treated
 * as deliberate and not reported.
 *
 * @param text - The input string to scan.
 * @param preserveCodeBlocks - When true, skips protected zones.
 * @returns Detected blobs in document order.
 */
export function detectBinaryBlobs(
  text: string,
  preserveCodeBlocks: boolean = true,
): BinaryBlob[] {
  if (!preserveCodeBlocks) {
    return findBlobs(text);
  }

  const blobs: BinaryBlob[] = [];
  let offset = 0;
  for (const zone of extractZones(text)) {
    if (!zone.protected) {
      for (const blob of findBlobs(zone.content)) {
        blobs.push({ content: blob.content, index: blob.index + offset });
      }
    }
    offset += zone.content.length;
  }
  return blobs;
}

/**
 * Builds human-readable warning strings for detected blobs. Used to populate
 * `TokenZapResult.warnings` when reporting is enabled.
 *
 * @param text - The input string to scan.
 * @param preserveCodeBlocks - When true, skips protected zones.
 * @returns One warning string per detected blob.
 */
export function detectBinaryBlobWarnings(
  text: string,
  preserveCodeBlocks: boolean = true,
): string[] {
  return detectBinaryBlobs(text, preserveCodeBlocks).map(
    (blob) =>
      `Possible base64 or binary data blob detected (${blob.content.length} characters at index ${blob.index}).`,
  );
}

/**
 * Replaces each detected blob in a segment with a short placeholder.
 */
function replaceBlobs(segment: string): string {
  const blobs = findBlobs(segment);
  if (blobs.length === 0) {
    return segment;
  }

  let result = "";
  let last = 0;
  for (const blob of blobs) {
    result +=
      segment.slice(last, blob.index) +
      `[binary data removed, ${blob.content.length} characters]`;
    last = blob.index + blob.content.length;
  }
  return result + segment.slice(last);
}

/**
 * Replaces detected base64-like or binary data blobs with a short
 * placeholder of the form `[binary data removed, n characters]`.
 * When preserveCodeBlocks is true, blobs inside fenced code blocks,
 * inline code, and markdown tables are left untouched.
 *
 * OPT-IN (default: false) because it alters content — some prompts
 * intentionally include encoded data.
 *
 * @param text - The input string.
 * @param preserveCodeBlocks - When true, protects code zones from stripping.
 * @returns The cleaned string with prose blobs replaced by placeholders.
 */
export function stripBinaryBlobs(
  text: string,
  preserveCodeBlocks: boolean = true,
): string {
  if (!preserveCodeBlocks) {
    return replaceBlobs(text);
  }

  return extractZones(text)
    .map((zone) => (zone.protected ? zone.content : replaceBlobs(zone.content)))
    .join("");
}
