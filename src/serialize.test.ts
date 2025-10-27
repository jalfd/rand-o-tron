import { describe, it } from "node:test";
import { serialize, deserialize, type State } from "./serialize";
import { expect } from "chai";

describe("Serialization round trip", () => {
  it("round-trips a valid object", () => {
    const state: State = { me: 5, you: 3, him: 1, her: 1 };
    const serialized = serialize({ ...state });
    const result = deserialize(serialized);
    expect(result).to.deep.equal(state);
  });
  it("throws when deserializing invalid JSON", () => {
    expect(() => deserialize("zonk")).to.throw();
  });
  it("throws when deserializing data that does not match schema", () => {
    const bad_state = JSON.stringify({ me: 5, you: 3, him: 1, her: 1, cheese: "waffles" });
    expect(() => deserialize(bad_state)).to.throw();
  });
  it("throws before serializing an invalid object", () => {
    const state: State = { me: 5, you: 3, him: 1, her: 1 };
    (state as any).waffles = "cheese";
    expect(() => serialize({ ...state })).to.throw();
  });
});
