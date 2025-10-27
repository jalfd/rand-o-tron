export function write(state: string) {
  sessionStorage.setItem("rand-o-tron.state", state);
}

export function read(): string | null {
  return sessionStorage.getItem("rand-o-tron.state");
}
