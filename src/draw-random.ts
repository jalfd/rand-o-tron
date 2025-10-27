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
    if (entries.length === 0) {
        throw new Error("Could not draw from an empty list");
    }
    const idx = Math.floor(Math.random() * entries.length);
    return entries[idx]!;
  },

  selectLoser: function (
    selected: Set<string>,
    winner: string
  ): string | null {
    if (!selected.has(winner)) {
        throw new Error(`Entry ${winner} was not selected`)
    }

    const selected_local = new Set(selected);
    selected_local.delete(winner);
    if (selected_local.size === 0){
        return null;
    }

    const arr = [...selected_local];
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx]!;
  },
};

export function draw(
  impl: typeof drawImpl,
  state: State,
  selected: Set<string>
): string {
  const entries = impl.setupDrawEntries(state, selected);
  const winner = impl.drawWinner(entries);
  const loser = impl.selectLoser(selected, winner);
  state[loser]! += 1;
  return winner;
}
