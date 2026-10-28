"use client";

import { useEffect, useState } from "react";
import type { BuildingSummary } from "@/lib/hpd";
import type { Lease } from "@/lib/lease-schema";

const CLASSES = [
  { key: "C", label: "Immediately hazardous", color: "text-class-c" },
  { key: "B", label: "Hazardous", color: "text-class-b" },
  { key: "A", label: "Non-hazardous", color: "text-class-a" },
] as const;

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; data: BuildingSummary };

export function BuildingCheck({ address }: { address: Lease["address"] }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!address) return;
    const qs = new URLSearchParams({ house: address.houseNumber, street: address.streetName, zip: address.zip ?? "" });
    fetch(`/api/building?${qs}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error);
        setState({ kind: "done", data: body });
      })
      .catch((e) => setState({ kind: "error", message: e.message || "NYC's building records aren't responding right now." }));
  }, [address, attempt]);

  return (
    <section aria-labelledby="building-heading">
      <h2 id="building-heading" className="text-xl font-semibold">
        Your building&rsquo;s record
      </h2>
      {!address ? (
        <p className="mt-2 text-muted">We couldn&rsquo;t find the apartment address in your lease.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            Open HPD violations at {address.line1}, checked live each time you visit.
          </p>
          {state.kind === "loading" && <p className="mt-4 text-muted" role="status">Checking city records…</p>}
          {state.kind === "error" && (
            <p className="mt-4" role="alert">
              {state.message}{" "}
              <button type="button" className="font-medium text-action underline" onClick={() => { setState({ kind: "loading" }); setAttempt((n) => n + 1); }}>
                Try again
              </button>
            </p>
          )}
          {state.kind === "done" && !state.data.found && (
            <p className="mt-4">No HPD records found for this address. That can mean a newer building, or an address the city lists differently.</p>
          )}
          {state.kind === "done" && state.data.found && (
            <>
              <dl className="mt-4 grid grid-cols-3 gap-4">
                {CLASSES.map((c) => (
                  <div key={c.key}>
                    <dd className={`text-3xl font-semibold tabular-nums ${c.color}`}>{state.data.open[c.key]}</dd>
                    <dt className="text-sm text-muted">
                      {c.label} <span className="whitespace-nowrap">(Class {c.key})</span>
                    </dt>
                  </div>
                ))}
              </dl>
              {state.data.recent.length > 0 && (
                <ul className="mt-5 space-y-2 text-sm">
                  {state.data.recent.map((r, i) => (
                    <li key={i} className="border-t border-rule pt-2 leading-relaxed">
                      <span className="text-muted">Class {r.class}, inspected {r.date}:</span> {r.description.toLowerCase()}
                    </li>
                  ))}
                </ul>
              )}
              <a href={state.data.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-action underline">
                Source: NYC Open Data, HPD violations
              </a>
            </>
          )}
        </>
      )}
    </section>
  );
}
