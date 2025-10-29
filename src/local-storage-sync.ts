export function write(state: string) {
  localStorage.setItem("rand-o-tron.state", state);
}

export function read(): string {
  return localStorage.getItem("rand-o-tron.state") ?? "{}";
}
