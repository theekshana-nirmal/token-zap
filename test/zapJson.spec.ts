import { describe, it, expect } from "vitest";
import { zapJson } from "../index.js";

describe("zapJson", () => {
  describe("removal rules", () => {
    it("removes null values", () => {
      expect(zapJson({ a: null, b: 1 })).toEqual({ b: 1 });
    });

    it("removes undefined values", () => {
      expect(zapJson({ a: undefined, b: 1 })).toEqual({ b: 1 });
    });

    it("removes empty strings but keeps whitespace strings", () => {
      expect(zapJson({ a: "", b: " ", c: "x" })).toEqual({ b: " ", c: "x" });
    });

    it("removes empty arrays", () => {
      expect(zapJson({ a: [], b: [1] })).toEqual({ b: [1] });
    });

    it("removes empty objects", () => {
      expect(zapJson({ a: {}, b: { c: 1 } })).toEqual({ b: { c: 1 } });
    });

    it("keeps falsy-but-meaningful values", () => {
      const result = zapJson({
        zero: 0,
        no: false,
        notANumber: NaN,
        emptyString: "",
      }) as Record<string, unknown>;

      expect(result.zero).toBe(0);
      expect(result.no).toBe(false);
      expect(Object.is(result.notANumber, NaN)).toBe(true);
      expect(result).not.toHaveProperty("emptyString");
    });
  });

  describe("nested structures", () => {
    it("cleans nested objects", () => {
      expect(
        zapJson({
          user: { name: "ada", nickname: null, tags: [] },
        }),
      ).toEqual({ user: { name: "ada" } });
    });

    it("cleans arrays of objects", () => {
      expect(
        zapJson([
          { id: 1, note: null },
          { id: 2, meta: {} },
        ]),
      ).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("drops array items and shifts indexes", () => {
      expect(zapJson([null, "a", ""])).toEqual(["a"]);
    });

    it("drops containers that become empty after cleaning", () => {
      expect(zapJson({ items: [null, ""], meta: { empty: null } })).toEqual({});
    });

    it("handles a mixed deep structure end to end", () => {
      const apiResponse = {
        id: 123,
        name: "report",
        description: null,
        flags: { verbose: false, quiet: false, trace: null },
        pages: [
          { number: 1, body: "text", footnote: null, links: [] },
          { number: 2, body: "", attachment: { data: null } },
        ],
        cache: {},
      };

      expect(zapJson(apiResponse)).toEqual({
        id: 123,
        name: "report",
        flags: { verbose: false, quiet: false },
        pages: [{ number: 1, body: "text" }, { number: 2 }],
      });
    });
  });

  describe("purity", () => {
    it("does not mutate the input", () => {
      const input = { a: null, nested: { b: [] }, list: [null, 1] };
      const snapshot = JSON.parse(JSON.stringify(input));

      zapJson(input);

      expect(input).toEqual(snapshot);
    });

    it("returns new containers, not references into the input", () => {
      const nested = { b: 1 };
      const input = { nested, list: [2] };
      const result = zapJson(input) as {
        nested: { b: number };
        list: number[];
      };

      expect(result.nested).not.toBe(nested);
      expect(result.list).not.toBe(input.list);
      expect(result.nested).toEqual({ b: 1 });
    });
  });

  describe("circular and shared references", () => {
    it("drops circular object references instead of throwing", () => {
      const cyclic: Record<string, unknown> = { name: "node" };
      cyclic.self = cyclic;

      expect(zapJson({ data: cyclic, keep: 1 })).toEqual({
        data: { name: "node" },
        keep: 1,
      });
    });

    it("drops circular array references instead of throwing", () => {
      const cyclic: unknown[] = [1];
      cyclic.push(cyclic);

      expect(zapJson({ data: cyclic, keep: 1 })).toEqual({
        data: [1],
        keep: 1,
      });
    });

    it("keeps shared non-circular references in every position", () => {
      const shared = { v: 1 };
      expect(zapJson({ a: shared, b: shared })).toEqual({
        a: { v: 1 },
        b: { v: 1 },
      });
    });
  });

  describe("non-plain objects and scalars", () => {
    it("passes non-plain objects through by reference", () => {
      const date = new Date("2026-01-01T00:00:00Z");
      const map = new Map([["k", "v"]]);
      const result = zapJson({ when: date, index: map, keep: 1 }) as Record<
        string,
        unknown
      >;

      expect(result.when).toBe(date);
      expect(result.index).toBe(map);
      expect(result.keep).toBe(1);
    });

    it("returns top-level scalars unchanged", () => {
      expect(zapJson(5)).toBe(5);
      expect(zapJson(null)).toBe(null);
      expect(zapJson("")).toBe("");
      expect(zapJson(false)).toBe(false);
    });

    it("returns top-level containers even when empty", () => {
      expect(zapJson({})).toEqual({});
      expect(zapJson([])).toEqual([]);
    });
  });
});
