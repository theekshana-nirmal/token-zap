/**
 * Recursively removes token-wasting empty values from structured data
 * before it is serialized into a prompt.
 *
 * Standard JSON.stringify() removes whitespace but keeps null values,
 * empty strings, empty arrays, and empty objects — all of which consume
 * tokens while adding no signal for the model.
 *
 * Removal rules (applied at every depth):
 * - `null` and `undefined` values are removed
 * - empty strings ("" exactly) are removed
 * - arrays and plain objects that are empty AFTER cleaning are removed
 * - `0`, `false`, `NaN`, and whitespace-only strings are kept
 *
 * Plain objects and arrays are rebuilt — the input is never mutated.
 * Non-plain objects (Date, Map, class instances, …) are passed through
 * by reference untouched; pair with JSON.stringify() semantics as needed.
 *
 * Circular references are detected and the cyclic branch is dropped
 * rather than throwing, so polluted API payloads cannot crash the call.
 *
 * OPT-IN and potentially unsafe when a downstream system relies on the
 * presence of null versus a missing key: this utility erases that
 * distinction by design.
 */

/** A value zapJson considers removable at any depth. */
function isDroppable(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function cleanValue(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return undefined;
    }
    seen.add(value);
    const items: unknown[] = [];
    for (const item of value) {
      const cleaned = cleanValue(item, seen);
      if (!isDroppable(cleaned)) {
        items.push(cleaned);
      }
    }
    // Released so shared (non-circular) references elsewhere in the data
    // are cleaned again rather than mistaken for a cycle.
    seen.delete(value);
    return items;
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) {
      return undefined;
    }
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const cleaned = cleanValue(entry, seen);
      if (!isDroppable(cleaned)) {
        result[key] = cleaned;
      }
    }
    seen.delete(value);
    return result;
  }

  return value;
}

/**
 * Returns a cleaned copy of the input with null values, empty strings,
 * empty arrays, and empty objects removed at every depth.
 *
 * @param data - Structured data (plain objects, arrays, primitives).
 * @returns A new structure when containers are involved; scalars are
 * returned unchanged.
 */
export function zapJson(data: unknown): unknown {
  const cleaned = cleanValue(data, new WeakSet());
  // Nothing to remove a scalar from: null, undefined, and "" pass through.
  return cleaned === undefined ? data : cleaned;
}
