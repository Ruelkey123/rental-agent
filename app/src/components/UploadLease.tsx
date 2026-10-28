"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Lease } from "@/lib/lease-schema";
import { saveLease } from "@/lib/storage";

const MAX_BYTES = 4 * 1024 * 1024;

export function UploadLease() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "error">("idle");
  const [error, setError] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);

  async function read(file: File) {
    setLastFile(file);
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError("This file is over 4 MB. Try a smaller scan or export the PDF again.");
      return;
    }
    setStatus("reading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/lease", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "The lease couldn't be read.");
      saveLease(body as Lease);
      router.push("/rental");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "The lease couldn't be read.");
    }
  }

  async function trySample() {
    const blob = await (await fetch("/sample-lease.pdf")).blob();
    read(new File([blob], "sample-lease.pdf", { type: "application/pdf" }));
  }

  if (status === "reading") {
    return (
      <div className="rounded-md border border-rule bg-wash p-8" role="status" aria-live="polite">
        <p className="font-medium">Reading your lease…</p>
        <p className="mt-1 text-sm text-muted">Checking every clause against New York rules. This takes about 20 seconds.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border border-dashed border-ink/30 p-8">
        <p className="font-medium">Upload your lease</p>
        <p className="mt-1 text-sm text-muted">PDF, up to 4 MB. It&rsquo;s read once and never stored on our servers.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="rounded-md bg-ink px-4 py-2.5 font-medium text-paper hover:opacity-90"
          >
            Choose a PDF
          </button>
          <button
            type="button"
            onClick={trySample}
            className="rounded-md border border-ink/25 px-4 py-2.5 font-medium hover:bg-wash"
          >
            Try with a sample lease
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) read(file);
            e.target.value = "";
          }}
        />
      </div>
      {status === "error" && (
        <div className="mt-4 rounded-md border border-class-c/40 p-4" role="alert">
          <p className="text-class-c">{error}</p>
          {lastFile && lastFile.size <= MAX_BYTES && (
            <button type="button" onClick={() => read(lastFile)} className="mt-2 font-medium text-action underline">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
