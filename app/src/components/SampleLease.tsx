"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lease } from "@/lib/lease-schema";
import { saveLease } from "@/lib/storage";

export function SampleLease() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "reading" | "error">("idle");
  const [error, setError] = useState("");

  async function start() {
    setStatus("reading");
    try {
      const pdf = await fetch("/sample-lease.pdf");
      if (!pdf.ok) throw new Error("The sample lease couldn't be loaded.");
      const form = new FormData();
      form.append("file", new File([await pdf.blob()], "sample-lease.pdf", { type: "application/pdf" }));
      const res = await fetch("/api/lease", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "The lease couldn't be read.");
      saveLease(body as Lease);
      router.push("/rental");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error && e.message ? e.message : "The lease couldn't be read.");
    }
  }

  if (status === "reading") {
    return (
      <div className="rounded-md border border-rule bg-wash p-8" role="status" aria-live="polite">
        <p className="font-medium">Reading the lease…</p>
        <p className="mt-1 text-sm text-muted">Checking every clause against New York rules. This takes about 20 seconds.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border border-ink/20 p-8">
        <p className="font-medium">Try it with a sample NYC lease</p>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted">
          A fictional tenant, Jordan Rivera, in a real Bronx building. The agent reads the lease live, just like it would yours.{" "}
          <a href="/sample-lease.pdf" target="_blank" rel="noreferrer" className="text-action underline">
            View the sample lease
          </a>
        </p>
        <button type="button" onClick={start} className="mt-5 rounded-md bg-ink px-4 py-2.5 font-medium text-paper hover:opacity-90">
          Read the sample lease
        </button>
      </div>
      {status === "error" && (
        <div className="mt-4 rounded-md border border-class-c/40 p-4" role="alert">
          <p className="text-class-c">{error}</p>
          <button type="button" onClick={start} className="mt-2 font-medium text-action underline">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
