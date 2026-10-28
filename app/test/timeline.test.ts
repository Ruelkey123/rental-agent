import { describe, expect, test } from "vitest";
import { buildTimeline, toIcs } from "@/lib/timeline";
import { lease } from "./fixtures";

const yearLease = lease({ leaseStart: "2026-01-01", leaseEnd: "2026-12-31", rentDueDay: 1, tenantNoticeDays: 60 });

describe("buildTimeline", () => {
  test("a full lease yields four events in date order", () => {
    const events = buildTimeline(yearLease);
    expect(events.map((e) => e.id)).toEqual(["rent-due", "tenant-notice", "lease-end", "deposit-deadline"]);
    expect(events.find((e) => e.id === "rent-due")).toMatchObject({ date: "2026-01-01", recurrence: "monthly" });
    expect(events.find((e) => e.id === "tenant-notice")!.date).toBe("2026-11-01");
    expect(events.find((e) => e.id === "lease-end")!.date).toBe("2026-12-31");
    expect(events.find((e) => e.id === "deposit-deadline")!.date).toBe("2027-01-14");
  });

  test("first rent date rolls to next month when the due day already passed", () => {
    const events = buildTimeline(lease({ leaseStart: "2026-01-15", rentDueDay: 1 }));
    expect(events[0]).toMatchObject({ id: "rent-due", date: "2026-02-01" });
  });

  test("null lease end leaves only rent", () => {
    const events = buildTimeline(lease({ leaseStart: "2026-01-01", rentDueDay: 1 }));
    expect(events.map((e) => e.id)).toEqual(["rent-due"]);
  });

  test("an empty lease yields no events", () => {
    expect(buildTimeline(lease())).toEqual([]);
  });
});

describe("toIcs", () => {
  const ics = toIcs(buildTimeline(yearLease), "2026-12-31");

  test("is a CRLF calendar with one VEVENT per event", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  test("uses all-day dates and a monthly rule for rent", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261101");
    expect(ics).toContain("RRULE:FREQ=MONTHLY;UNTIL=20261231");
    expect(ics).toContain("UID:rent-due@rental-agent");
  });

  test("rent with no lease end has no UNTIL", () => {
    const open = toIcs(buildTimeline(lease({ leaseStart: "2026-01-01", rentDueDay: 1 })), null);
    expect(open).toContain("RRULE:FREQ=MONTHLY\r\n");
  });
});
