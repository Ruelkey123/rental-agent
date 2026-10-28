"use client";

import Link from "next/link";
import { useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { Shell } from "@/components/Shell";
import { checkCharge, headline, type ChargeInput, type ChargeVerdict } from "@/lib/charge";
import { todayISO } from "@/lib/dates";
import { RULES } from "@/lib/rules";
import { useLease } from "@/lib/use-lease";

const day = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const field = "mt-1 w-full rounded-md border border-ink/25 bg-paper px-3 py-2";

export default function ChargePage() {
  const lease = useLease();
  const [verdict, setVerdict] = useState<ChargeVerdict | null>(null);
  const [charge, setCharge] = useState<ChargeInput | null>(null);
  const [letter, setLetter] = useState<{ kind: "idle" | "writing" | "done" | "error"; text: string }>({ kind: "idle", text: "" });
  const [received, setReceived] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!lease) return <Shell><p className="pt-10 text-muted">Loading your rental…</p></Shell>;

  async function writeLetter(input: ChargeInput) {
    setLetter({ kind: "writing", text: "" });
    try {
      const res = await fetch("/api/letter", { method: "POST", body: JSON.stringify({ lease, charge: input }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.letter) throw new Error(body.error);
      setLetter({ kind: "done", text: body.letter });
    } catch (e) {
      setLetter({ kind: "error", text: e instanceof Error && e.message ? e.message : "The letter couldn't be written." });
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const input: ChargeInput = {
      amountCharged: Number(data.get("amount")),
      reason: String(data.get("reason") ?? ""),
      moveOutDate: String(data.get("moveOut")),
      statementReceived: received,
      statementDate: received && data.get("statementDate") ? String(data.get("statementDate")) : null,
      today: todayISO(),
    };
    setCharge(input);
    setVerdict(checkCharge(lease!, input));
    setCopied(false);
    writeLetter(input);
  }

  return (
    <Shell>
      <Link href="/rental" className="text-sm text-muted underline">
        Back to your rental
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">They&rsquo;re charging me</h1>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
        Tell me what your landlord is keeping from your deposit. I&rsquo;ll check it against New York&rsquo;s rules and write
        the letter.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Amount they&rsquo;re keeping ($)</span>
          <input name="amount" type="number" min="0" step="0.01" required defaultValue={1000} className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Move-out date</span>
          <input name="moveOut" type="date" required defaultValue={lease.leaseEnd ?? ""} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">What they say it&rsquo;s for</span>
          <input name="reason" type="text" maxLength={500} placeholder="Repainting and floor repairs" className={field} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Did they send an itemized list of deductions?</legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" name="received" checked={!received} onChange={() => setReceived(false)} /> No
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="received" checked={received} onChange={() => setReceived(true)} /> Yes
            </label>
          </div>
        </fieldset>
        {received && (
          <label className="block">
            <span className="text-sm font-medium">Date you got it</span>
            <input name="statementDate" type="date" className={field} />
          </label>
        )}
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2.5 font-medium text-paper hover:opacity-90">
            Check this charge
          </button>
        </div>
      </form>

      {verdict && charge && (
        <section className="mt-12" aria-live="polite">
          <h2 className="text-2xl leading-snug font-semibold">{headline(verdict)}</h2>
          <p className="mt-2 text-muted">
            Deadline for the itemized statement: <strong className="text-ink">{day(verdict.deadline)}</strong>, 14 days after you
            moved out.
          </p>
          <ul className="mt-5 space-y-4">
            {verdict.findings.map((f) => (
              <li key={f.ruleId} className="border-l-2 border-ink pl-4">
                <p className="leading-relaxed">{f.text}</p>
                <a href={RULES[f.ruleId].sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-action underline">
                  {RULES[f.ruleId].citation}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold">Your letter</h2>
              {letter.kind === "done" && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(letter.text);
                    setCopied(true);
                  }}
                  className="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-wash"
                >
                  {copied ? "Copied" : "Copy letter"}
                </button>
              )}
            </div>
            {letter.kind === "writing" && <p className="mt-4 text-muted" role="status">Writing your letter…</p>}
            {letter.kind === "error" && (
              <p className="mt-4" role="alert">
                {letter.text}{" "}
                <button type="button" onClick={() => writeLetter(charge)} className="font-medium text-action underline">
                  Try again
                </button>
              </p>
            )}
            {letter.kind === "done" && (
              <div className="mt-4 rounded-md border border-rule bg-wash p-6 font-serif text-[1.05rem] leading-relaxed whitespace-pre-wrap shadow-sm">
                {letter.text}
              </div>
            )}
            <p className="mt-3 text-sm text-muted">Review it, fill in anything in [brackets], and send it yourself, ideally by email so you have a record.</p>
          </div>
        </section>
      )}
      <Disclaimer />
    </Shell>
  );
}
