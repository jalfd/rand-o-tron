import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { State } from "./serialize";
import {
  buildDrawImpl,
  draw,
  updateStatePostDraw,
  type DrawImpl,
} from "./draw-random";
import * as td from "testdouble";

afterEach(function(){
  td.reset();
  console.log("done with test from draw")
})

describe("setupDrawEntries", () => {
  describe("builds an array with each entry duplicated according to its count", () => {
    const state: State = {
      me: 1,
      you: 3,
      him: 2,
      her: 1,
    };
    it("builds array from all known entries", () => {
      const entries = buildDrawImpl().setupDrawEntries(
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
      const entries = buildDrawImpl().setupDrawEntries(
        state,
        new Set(["him", "her"])
      );
      expect(entries.sort()).to.deep.equal(["her", "him", "him"]);
    });
    it("builds array with 1 entry for unknown entries", () => {
      const entries = buildDrawImpl().setupDrawEntries(
        state,
        new Set(["you", "someone"])
      );
      expect(entries.sort()).to.deep.equal(["someone", "you", "you", "you"]);
    });
    it("throws if no names are selected", () => {
      expect(() =>
        buildDrawImpl().setupDrawEntries(state, new Set([]))
      ).to.throw();
    });
  });
});

describe("drawWinner", () => {
  describe("picks an entry from the given array", () => {
    it("selects any of the entries in the array", () => {
      const statistics: Record<string, number> = {};

      const entries = ["me", "me", "you"];
      for (let i = 0; i < 10000; ++i) {
        const winner = buildDrawImpl().drawWinner(entries);
        statistics[winner] = (statistics[winner] ?? 0) + 1;
      }

      expect(Object.keys(statistics).sort()).to.deep.equal(["me", "you"]);
    });

    it("approximates the correct distribution", () => {
      const statistics: Record<string, number> = {};

      const entries = ["me", "me", "you"];
      for (let i = 0; i < 10000; ++i) {
        const winner = buildDrawImpl().drawWinner(entries);
        statistics[winner] = (statistics[winner] ?? 0) + 1;
      }

      expect(Math.abs(statistics["me"]! / statistics["you"]!)).to.be.closeTo(
        2,
        0.5
      );
    });

    it("throws on an empty list of entries", () => {
      expect(() => buildDrawImpl().drawWinner([])).to.throw();
    });
  });
});

describe("selectLoser", () => {
  describe("picks an entry from the given array", () => {
    it("selects any of the entries in the array", () => {
      const statistics: Record<string, number> = {};

      const selected = new Set(["me", "you", "them"]);
      for (let i = 0; i < 10000; ++i) {
        const loser = buildDrawImpl().selectLoser(selected, "them");
        if (loser === null) {
          throw new Error("this should not happen");
        }
        statistics[loser] = (statistics[loser] ?? 0) + 1;
      }

      expect(Object.keys(statistics).sort()).to.deep.equal(["me", "you"]);
      // loser should be picked evenly, regardless of counters
      // loser is always one of the names in 'selected'
    });

    it("approximates an even distribution", () => {
      const statistics: Record<string, number> = {};

      const selected = new Set(["me", "you", "them"]);
      for (let i = 0; i < 10000; ++i) {
        const loser = buildDrawImpl().selectLoser(selected, "them");
        if (loser === null) {
          throw new Error("this should not happen");
        }
        statistics[loser] = (statistics[loser] ?? 0) + 1;
      }

      expect(Math.abs(statistics["me"]! / statistics["you"]!)).to.be.closeTo(
        1,
        0.25
      );
    });

    it("returns null if only one entry was selected", () => {
      expect(buildDrawImpl().selectLoser(new Set(["me"]), "me")).to.be.null;
    });

    it("throws if the winner was not selected", () => {
      expect(() =>
        buildDrawImpl().selectLoser(new Set(["me"]), "you")
      ).to.throw();
    });
  });
});

describe("registerSelected", () => {
  it("adds any selected entries that didn't already exist in state", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().registerSelected(state, new Set(["him", "her"]));
    expect(state).to.deep.equal({ me: 3, you: 1, them: 1, him: 1, her: 1 });
  });

  it("does not touch the count of existing entries", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().registerSelected(state, new Set(["me", "you", "them"]));
    expect(state).to.deep.equal({ me: 3, you: 1, them: 1 });
  });
  it("does not remove entries that were not selected", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().registerSelected(state, new Set(["me", "you"]));
    expect(state.them).to.equal(1);
  });
});

describe("updateState", () => {
  it("resets winner's count to 1", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().updateState(state, "me", "you");
    expect(state.me).to.equal(1);
  });
  it("increments selected loser's count", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().updateState(state, "me", "you");
    expect(state.you).to.equal(2);
  });
  it("ignore if loser is null", () => {
    const state = { me: 3, you: 1, them: 1 };
    buildDrawImpl().updateState(state, "me", null);
    expect(state).to.deep.equal({ me: 1, you: 1, them: 1 });
  });

  it("throws if winner is not known", () => {
    const state = { me: 3, you: 1, them: 1 };
    expect(() => buildDrawImpl().updateState(state, "him", "me")).to.throw();
  });

  it("throws if loser is not known", () => {
    const state = { me: 3, you: 1, them: 1 };
    expect(() => buildDrawImpl().updateState(state, "me", "him")).to.throw();
  });
});

describe("draw()", () => {
  let impl: DrawImpl;
  let state: Record<string, number>;
  let selected: Set<string>;

  beforeEach(() => {
    impl = buildDrawImpl();
    impl.drawWinner = td.function(impl.drawWinner);

    state = { me: 3, you: 1, them: 1 };
    selected = new Set(["me", "you", "them"]);
  });

  it("picks the winner specified by drawWinner", () => {
    td.when(impl.drawWinner(["me", "me", "me", "you", "them"])).thenReturn(
      "them"
    );

    expect(draw(impl, state, selected)).to.equal("them");
  });
});

describe("updateStatePostDraw()", () => {
  let impl: DrawImpl;
  let state: Record<string, number>;
  let selected: Set<string>;
  const winner: string = "me";

  beforeEach(() => {
    impl = buildDrawImpl();
    impl.selectLoser = td.function(impl.selectLoser);
    state = { me: 3, you: 1, them: 1 };
    selected = new Set(["me", "you", "them"]);
  });

  it("resets the winner", () => {
    td.when(impl.selectLoser(selected, winner)).thenReturn("you");
    updateStatePostDraw(impl, state, selected, winner);
    expect(state).to.include.keys("me", "you", "them");
    expect(state).to.include({ me: 1 });
  });

  it("increments the chosen loser", () => {
    td.when(impl.selectLoser(selected, winner)).thenReturn("you");
    updateStatePostDraw(impl, state, selected, winner);
    expect(state).to.include.keys("me", "you", "them");
    expect(state).to.include({ you: 2 });
  });

  it("adds unknown entries with value 1", () => {
    const selected_superset = new Set(["me", "you", "them", "him", "her"]);
    td.when(impl.selectLoser(selected_superset, winner)).thenReturn("you");
    updateStatePostDraw(impl, state, selected_superset, winner);
    expect(state).to.include.keys("me", "you", "them", "him", "her");
    expect(state).to.include({ him: 1, her: 1 });
  });
});