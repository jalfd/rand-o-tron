import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serialize, deserialize, type State } from "./serialize";

describe("Serialization round trip", () => {
  it("round-trips a valid object", () => {
    const state: State = { me: 5, you: 3, him: 1, her: 1 };
    const serialized = serialize({ ...state });
    const result = deserialize(serialized);
    assert.deepStrictEqual(result, state);
  });
  it("throws when deserializing invalid JSON", () => {
    assert.throws(() => deserialize("zonk"));
  });
  it("throws when deserializing data that does not match schema", () => {
    const bad_state = JSON.stringify({ me: 5, you: 3, him: 1, her: 1, cheese: "waffles" });
    assert.throws(() => deserialize(bad_state));
  });
  it("throws before serializing an invalid object", () => {
    const state: State = { me: 5, you: 3, him: 1, her: 1 };
    (state as any).waffles = "cheese";
    assert.throws(() => serialize({ ...state }));
  });
});
