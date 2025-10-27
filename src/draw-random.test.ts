import { expect } from "chai";
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
      expect(entries.sort()).to.deep.equal([
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
      expect(entries.sort()).to.deep.equal(["her", "him", "him"]);
    });
    it("builds array with 1 entry for unknown entries", () => {
      const entries = drawImpl.setupDrawEntries(
        state,
        new Set(["you", "someone"])
      );
      expect(entries.sort()).to.deep.equal(["someone", "you", "you", "you"]);
    });
    it("throws if no names are selected", () => {
      expect(() => drawImpl.setupDrawEntries(state, new Set([]))).to.throw();
    });
  });
});

describe("drawWinner", () => {
  describe("picks an entry from the given array", () => {
    it("selects any of the entries in the array", () => {
      const statistics: Record<string, number> = {};

      const entries = ["me", "me", "you"];
      for (let i = 0; i < 10000; ++i) {
        const winner = drawImpl.drawWinner(entries);
        statistics[winner] = (statistics[winner] ?? 0) + 1;
      }

      expect(Object.keys(statistics).sort()).to.deep.equal(["me", "you"]);
    });

    it("approximates the correct distribution", () => {
      const statistics: Record<string, number> = {};

      const entries = ["me", "me", "you"];
      for (let i = 0; i < 10000; ++i) {
        const winner = drawImpl.drawWinner(entries);
        statistics[winner] = (statistics[winner] ?? 0) + 1;
      }

      expect(Math.abs(statistics["me"]! / statistics["you"]!)).to.be.closeTo(
        2,
        0.1
      );
    });

    it("throws on an empty list of entries", () => {
      expect(() => drawImpl.drawWinner([])).to.throw();
    });
  });
});
