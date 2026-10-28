import { addDays } from "./dates";
import type { Lease } from "./lease-schema";

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  agentHelp: string;
  recurrence?: "monthly";
}

const pad = (n: number) => String(n).padStart(2, "0");

function firstRentDate(leaseStart: string, dueDay: number): string {
  const [y, m, d] = leaseStart.split("-").map(Number);
  const day = Math.min(dueDay, 28);
  if (d <= day) return `${y}-${pad(m)}-${pad(day)}`;
  return m === 12 ? `${y + 1}-01-${pad(day)}` : `${y}-${pad(m + 1)}-${pad(day)}`;
}

export function buildTimeline(lease: Lease): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const { leaseStart, leaseEnd, rentDueDay, tenantNoticeDays } = lease;

  if (leaseStart && rentDueDay) {
    events.push({
      id: "rent-due",
      date: firstRentDate(leaseStart, rentDueDay),
      title: "Rent due",
      agentHelp: "Late fees in NY are capped. I'll tell you if they overcharge.",
      recurrence: "monthly",
    });
  }
  if (leaseEnd && tenantNoticeDays != null) {
    events.push({
      id: "tenant-notice",
      date: addDays(leaseEnd, -tenantNoticeDays),
      title: "Last day to give notice",
      agentHelp: "Last day to tell your landlord you're leaving.",
    });
  }
  if (leaseEnd) {
    events.push(
      {
        id: "lease-end",
        date: leaseEnd,
        title: "Lease ends",
        agentHelp: "Ask for a move-out inspection before you go.",
      },
      {
        id: "deposit-deadline",
        date: addDays(leaseEnd, 14),
        title: "Deposit deadline",
        agentHelp: "Your landlord must send an itemized statement by today, or return your full deposit.",
      },
    );
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

const icsDate = (date: string) => date.replaceAll("-", "");
const icsText = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`);

export function toIcs(events: TimelineEvent[], leaseEnd: string | null): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rental Agent//EN", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@rental-agent`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `SUMMARY:${icsText(e.title)}`,
      `DESCRIPTION:${icsText(e.agentHelp)}`,
    );
    if (e.recurrence === "monthly") {
      lines.push(leaseEnd ? `RRULE:FREQ=MONTHLY;UNTIL=${icsDate(leaseEnd)}` : "RRULE:FREQ=MONTHLY");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
