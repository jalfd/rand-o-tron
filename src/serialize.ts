import z from "zod";

const state_schema = z.record(z.string(), z.number());
export type State = z.infer<typeof state_schema>;

export function serialize(state: State): string {
  state_schema.parse(state);
  return JSON.stringify(state);
}

export function deserialize(state: string): State {
  return state_schema.parse(JSON.parse(state));
}
