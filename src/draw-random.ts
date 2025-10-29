import type { State } from "./serialize";

const drawImpl = {
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

  selectLoser: function (selected: Set<string>, winner: string): string | null {
    if (!selected.has(winner)) {
      throw new Error(`Entry ${winner} was not selected`);
    }

    const selected_local = new Set(selected);
    selected_local.delete(winner);
    if (selected_local.size === 0) {
      return null;
    }

    const arr = [...selected_local];
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx]!;
  },

  registerSelected(state: State, selected: Set<string>): void {
    for (const name of selected) {
      if (!Object.hasOwn(state, name)) {
        state[name] = 1;
      }
    }
  },

  updateState(state: State, winner: string, loser: string | null) {
    if (loser) {
      if (!Object.hasOwn(state, loser)) {
        throw new Error(`Key ${loser} not found`);
      }
      state[loser]! += 1;
    }

    if (!Object.hasOwn(state, winner)) {
      throw new Error(`Key ${winner} not found`);
    }
    state[winner] = 1;
  },
};

export type DrawImpl = typeof drawImpl;

export function buildDrawImpl(): DrawImpl {
  return { ...drawImpl };
}

export function draw(
  impl: DrawImpl,
  state: State,
  selected: Set<string>
): string {
  const entries = impl.setupDrawEntries(state, selected);
  const winner = impl.drawWinner(entries);
  return winner;
}

export function updateStatePostDraw(
  impl: DrawImpl,
  state: State,
  selected: Set<string>,
  winner: string
) {
  const loser = impl.selectLoser(selected, winner);
  impl.registerSelected(state, selected);
  impl.updateState(state, winner, loser);
}

export function registerNewNames(
  impl: DrawImpl,
  state: State,
  names: Set<string>
) {
  impl.registerSelected(state, names);
}

export function mergeNames(state: State, names: Set<string>, new_name: string) {
  let min_count = Number.POSITIVE_INFINITY;
  for (const key of Object.keys(state)) {
    if (names.has(key)) {
      min_count = Math.min(min_count, state[key]!);
      delete state[key];
    }
  }
  state[new_name] = min_count;
}

export function deleteNames(state: State, names: Set<string>) {
  for (const key of Object.keys(state)) {
    if (names.has(key)) {
      delete state[key];
    }
  }
}
