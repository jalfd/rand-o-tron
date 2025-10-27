import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { State } from "./serialize";
import { drawImpl } from "./draw-random";

describe("setupDrawEntries", () => {
  describe("builds an array with each entry duplicated according to its count", () => {
    const state: State = {
      me: 1,
      you: 3,
      him: 2,
      her: 1,
    };
    it("builds array from all known entries", () => {
      const entries = drawImpl.setupDrawEntries(
        state,
        new Set(["me", "you", "him", "her"])
      );
      assert.deepStrictEqual(entries.sort(), [
        "her",
        "him",
        "him",
        "me",
        "you",
        "you",
        "you",
      ]);
    });
    it("builds array from a subset of entries", () => {
      const entries = drawImpl.setupDrawEntries(state, new Set(["him", "her"]));
      assert.deepStrictEqual(entries.sort(), ["her", "him", "him"]);
    });
    it("builds array with 1 entry for unknown entries", () => {
      const entries = drawImpl.setupDrawEntries(state, new Set(["you", "someone"]));
      assert.deepStrictEqual(entries.sort(), ["someone", "you", "you", "you"]);
    });
    it("throws if no names are selected", () => {
      assert.throws(() => drawImpl.setupDrawEntries(state, new Set([])));
    });
  });
});
