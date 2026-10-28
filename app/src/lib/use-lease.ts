"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import type { Lease } from "./lease-schema";
import { loadLease } from "./storage";

const noop = () => () => {};
let cache: { raw: string | null; lease: Lease | null } = { raw: null, lease: null };

// useSyncExternalStore needs a stable snapshot, so only swap it when the stored lease changes.
function snapshot(): Lease | null {
  const lease = loadLease();
  const raw = lease ? JSON.stringify(lease) : null;
  if (raw !== cache.raw) cache = { raw, lease };
  return cache.lease;
}

// Loads the saved lease on the client and sends the visitor home if there isn't one.
export function useLease(): Lease | null {
  const router = useRouter();
  const lease = useSyncExternalStore(noop, snapshot, () => null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    if (mounted && !lease) router.replace("/");
  }, [mounted, lease, router]);
  return lease;
}
