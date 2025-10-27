// given a state object (names -> counter), draw one and increment counters suitably

import type { State } from "./serialize";

export const drawImpl = {
  setupDrawEntries: function (state: State, selected: Set<string>): string[] {
    if (selected.size == 0) {
        throw new Error("No names selected");
    }
    let result: string[] = [];
    for (const name of selected) {
      const count = state[name] ?? 1;
      result = result.concat(Array(count).fill(name));
    }
    return result;
  },

  drawWinner: function (entries: string[]): string {
    return "";
  },

  selectLoser: function (
    state: State,
    selected: Set<string>,
    winner: string
  ): string {
    return "";
  },
};

export function draw(
  impl: typeof drawImpl,
  state: State,
  selected: Set<string>
): string {
  const entries = impl.setupDrawEntries(state, selected);
  const winner = impl.drawWinner(entries);
  const loser = impl.selectLoser(state, selected, winner);
  state[loser]! += 1;
  return winner;
}
