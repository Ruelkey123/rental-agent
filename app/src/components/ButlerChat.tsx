"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { amenityEvent, extractEmail, mailtoLink } from "@/lib/butler";
import { todayISO } from "@/lib/dates";
import type { Lease } from "@/lib/lease-schema";
import { toIcs } from "@/lib/timeline";

const STARTERS = ["My kitchen sink is leaking", "Book the rooftop grill Saturday at 6 pm", "The heat isn't working", "Can I have a dog?"];

const URGENCY = { routine: "Routine", soon: "Soon", urgent: "Urgent" } as const;

type Draft = { ok: true; subject: string; body: string; urgency?: keyof typeof URGENCY; amenity?: string; date?: string; time?: string };

function DraftCard({ draft, to }: { draft: Draft; to: string | null }) {
  const [copied, setCopied] = useState(false);
  const isAmenity = draft.amenity != null;

  function addToCalendar() {
    const event = amenityEvent({ amenity: draft.amenity!, date: draft.date!, time: draft.time! });
    const url = URL.createObjectURL(new Blob([toIcs([event], null)], { type: "text/calendar" }));
    Object.assign(document.createElement("a"), { href: url, download: "amenity-request.ics" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mt-3 rounded-md border border-rule bg-paper p-4">
      <p className="text-sm text-muted">
        {isAmenity ? "Amenity request" : `Work order · ${URGENCY[draft.urgency ?? "routine"]}`}
        {to ? ` to ${to}` : ""}
      </p>
      <p className="mt-1 font-semibold">{draft.subject}</p>
      <p className="mt-2 font-serif text-[1.02rem] leading-relaxed whitespace-pre-wrap">{draft.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={mailtoLink(to, draft.subject, draft.body)} className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-paper hover:opacity-90">
          Open in email
        </a>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
            setCopied(true);
          }}
          className="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-wash"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {isAmenity && (
          <button type="button" onClick={addToCalendar} className="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-wash">
            Add to my calendar
          </button>
        )}
      </div>
      {!to && <p className="mt-2 text-sm text-muted">I didn&rsquo;t find an email in your lease, so add your landlord&rsquo;s address before sending.</p>}
    </div>
  );
}

export function ButlerChat({ lease }: { lease: Lease }) {
  const to = extractEmail(lease.landlordContact);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", body: () => ({ lease, today: todayISO() }) }),
  });
  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <section aria-labelledby="butler-heading">
      <h2 id="butler-heading" className="text-xl font-semibold">
        Ask your rental agent
      </h2>
      <p className="mt-1 text-sm text-muted">
        Something broke, you want to book an amenity, or you&rsquo;re not sure what your lease says. I&rsquo;ll write the request and you hit send.
      </p>

      <div className="mt-4 rounded-md border border-rule bg-wash p-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-ink/20 bg-paper px-3 py-1.5 text-sm hover:border-ink/50">
                {s}
              </button>
            ))}
          </div>
        )}

        <ol className="space-y-4" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={m.role === "user" ? "max-w-[85%] rounded-lg bg-ink px-3 py-2 text-paper" : "max-w-full"}>
                {m.parts.map((part, i) => {
                  if (part.type === "text") return <p key={i} className="leading-relaxed whitespace-pre-wrap">{part.text}</p>;
                  if ((part.type === "tool-draftWorkOrder" || part.type === "tool-draftAmenityRequest") && part.state === "output-available") {
                    const out = part.output as Draft | { ok: false };
                    return out.ok ? <DraftCard key={i} draft={out} to={to} /> : null;
                  }
                  if (part.type === "tool-draftWorkOrder" || part.type === "tool-draftAmenityRequest") {
                    return <p key={i} className="mt-2 text-sm text-muted">Writing the request…</p>;
                  }
                  return null;
                })}
              </div>
            </li>
          ))}
          {status === "submitted" && <li className="text-sm text-muted">Thinking…</li>}
        </ol>

        {error && (
          <p className="mt-3" role="alert">
            I couldn&rsquo;t reply just now.{" "}
            <button type="button" onClick={() => regenerate()} className="font-medium text-action underline">
              Try again
            </button>
          </p>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="butler-input" className="sr-only">
            Message your rental agent
          </label>
          <input
            id="butler-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="The bathroom light flickers…"
            className="min-w-0 flex-1 rounded-md border border-ink/25 bg-paper px-3 py-2"
          />
          <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-ink px-4 py-2 font-medium text-paper disabled:opacity-40">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
