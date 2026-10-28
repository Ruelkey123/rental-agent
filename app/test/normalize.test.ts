import { describe, expect, test } from "vitest";
import { looksUnreadable, normalizeLease } from "@/lib/lease-schema";
import { emptyLease, lease } from "./fixtures";

describe("normalizeLease", () => {
  test("bad dates become null", () => {
    const l = normalizeLease(lease({ leaseStart: "January 1, 2026", leaseEnd: "2027-01", rentDueDay: 1 }));
    expect(l.leaseStart).toBeNull();
    expect(l.leaseEnd).toBeNull();
  });

  test("impossible calendar dates become null", () => {
    expect(normalizeLease(lease({ leaseEnd: "2026-02-31" })).leaseEnd).toBeNull();
  });

  test("rent due day outside 1–31 becomes null", () => {
    expect(normalizeLease(lease({ rentDueDay: 0 })).rentDueDay).toBeNull();
    expect(normalizeLease(lease({ rentDueDay: 32 })).rentDueDay).toBeNull();
  });

  test("empty strings become null", () => {
    expect(normalizeLease(lease({ landlordName: "  " })).landlordName).toBeNull();
  });

  test("an address without a house number or street becomes null", () => {
    const l = normalizeLease(
      lease({ address: { line1: "Apt 4B", unit: null, houseNumber: "", streetName: "SEDGWICK AVENUE", borough: null, zip: null } }),
    );
    expect(l.address).toBeNull();
  });

  test("valid values pass through", () => {
    const l = lease({ leaseStart: "2026-01-01", rentDueDay: 1, landlordName: "Maple" });
    expect(normalizeLease(l)).toEqual(l);
  });

  test("AI flags whose explanation cites law outside RULES are dropped", () => {
    const l = normalizeLease(
      lease({
        aiFlags: [
          { ruleId: "habitability", quote: "x", explanation: "This violates NYC Admin Code §27-2005." },
          { ruleId: "habitability", quote: "y", explanation: "You can't waive this." },
        ],
      }),
    );
    expect(l.aiFlags.map((f) => f.quote)).toEqual(["y"]);
  });
});

describe("looksUnreadable", () => {
  test("an empty extraction is unreadable", () => {
    expect(looksUnreadable(emptyLease())).toBe(true);
  });

  test("a lease with rent is readable", () => {
    expect(looksUnreadable(lease({ monthlyRent: 2500 }))).toBe(false);
  });
});
