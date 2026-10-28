import type { Lease } from "./lease-schema";

const KEY = "rental-agent:lease";
let memory: Lease | null = null;

// localStorage can be missing or throw (private mode, blocked site data).
// Memory keeps the session working either way.
export function saveLease(lease: Lease): void {
  memory = lease;
  try {
    localStorage.setItem(KEY, JSON.stringify(lease));
  } catch {}
}

export function loadLease(): Lease | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Lease;
  } catch {}
  return memory;
}

export function clearLease(): void {
  memory = null;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
