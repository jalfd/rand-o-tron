import z from "zod";

const state_schema = z.record(z.string(), z.number());
export type State = z.infer<typeof state_schema>;

export function serialize(state: State): string {
  state_schema.parse(state);
  const clone = { ...state };
  if (Object.hasOwn(clone, "")) {
    delete clone[""];
  }
  return JSON.stringify(clone);
}

export function deserialize(state: string): State {
  const state_obj = state_schema.parse(JSON.parse(state));
  if (Object.hasOwn(state_obj, "")) {
    delete state_obj[""];
  }
  return state_obj;
}
