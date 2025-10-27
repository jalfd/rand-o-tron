export function write(state: string) {
  sessionStorage.setItem("rand-o-tron.state", state);
}

export function read(): string {
  return sessionStorage.getItem("rand-o-tron.state") ?? "{}";
}
