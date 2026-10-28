"use client";

import type { TimelineEvent } from "@/lib/timeline";
import { toIcs } from "@/lib/timeline";

const day = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function Timeline({ events, leaseEnd }: { events: TimelineEvent[]; leaseEnd: string | null }) {
  function download() {
    const url = URL.createObjectURL(new Blob([toIcs(events, leaseEnd)], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "rental-agent.ics" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="timeline-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="timeline-heading" className="text-xl font-semibold">
          Your rental year
        </h2>
        {events.length > 0 && (
          <button type="button" onClick={download} className="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-wash">
            Add to my calendar
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <p className="mt-2 text-muted">We couldn&rsquo;t find lease dates to build a timeline from.</p>
      ) : (
        <ol className="mt-4">
          {events.map((e) => (
            <li key={e.id} className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-rule py-3">
              <time dateTime={e.date} className="text-sm text-muted tabular-nums">
                {e.recurrence === "monthly" ? `Monthly from ${day(e.date)}` : day(e.date)}
              </time>
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm leading-relaxed text-muted">{e.agentHelp}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
