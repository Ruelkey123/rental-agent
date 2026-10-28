import { describe, expect, test } from "vitest";
import { checkCharge, headline, type ChargeInput } from "@/lib/charge";
import { lease } from "./fixtures";

const base: ChargeInput = {
  amountCharged: 1000,
  reason: "Repairs",
  moveOutDate: "2026-09-30",
  statementReceived: false,
  statementDate: null,
  today: "2026-10-28",
};
const legalLease = lease({ monthlyRent: 2500, securityDeposit: 2500 });
const ruleIds = (v: ReturnType<typeof checkCharge>) => v.findings.map((f) => f.ruleId);

describe("checkCharge", () => {
  test("deadline is move-out + 14 days", () => {
    expect(checkCharge(legalLease, base).deadline).toBe("2026-10-14");
  });

  test("no statement and deadline passed → return full deposit", () => {
    const v = checkCharge(legalLease, base);
    expect(v.deadlinePassed).toBe(true);
    expect(v.ask).toBe("return-full-deposit");
    expect(ruleIds(v)).toEqual(expect.arrayContaining(["itemized-14-days", "forfeit-if-late"]));
  });

  test("statement sent after the deadline → return full deposit", () => {
    const v = checkCharge(legalLease, { ...base, statementReceived: true, statementDate: "2026-10-20" });
    expect(v.statementOnTime).toBe(false);
    expect(v.ask).toBe("return-full-deposit");
    expect(ruleIds(v)).toEqual(expect.arrayContaining(["itemized-14-days", "forfeit-if-late"]));
  });

  test("statement on time → ask for itemized receipts", () => {
    const v = checkCharge(legalLease, { ...base, statementReceived: true, statementDate: "2026-10-10" });
    expect(v.statementOnTime).toBe(true);
    expect(v.ask).toBe("itemized-receipts");
    expect(ruleIds(v)).toContain("itemized-14-days");
    expect(ruleIds(v)).not.toContain("forfeit-if-late");
  });

  test("no statement but still inside the window → wait", () => {
    const v = checkCharge(legalLease, { ...base, today: "2026-10-05" });
    expect(v.deadlinePassed).toBe(false);
    expect(v.statementOnTime).toBeNull();
    expect(v.ask).toBe("wait");
    expect(ruleIds(v)).toContain("itemized-14-days");
  });

  test("statement on the deadline day counts as on time", () => {
    const v = checkCharge(legalLease, { ...base, statementReceived: true, statementDate: "2026-10-14" });
    expect(v.statementOnTime).toBe(true);
  });

  test("deposit over one month's rent adds deposit-cap without changing the ask", () => {
    const v = checkCharge(lease({ monthlyRent: 2500, securityDeposit: 5000 }), base);
    expect(v.depositOverCap).toBe(true);
    expect(v.ask).toBe("return-full-deposit");
    expect(ruleIds(v)).toContain("deposit-cap");
  });

  test("move-out in the future → wait", () => {
    const v = checkCharge(legalLease, { ...base, moveOutDate: "2026-12-31" });
    expect(v.ask).toBe("wait");
  });

  test("statement dated before move-out is treated as on time", () => {
    const v = checkCharge(legalLease, { ...base, statementReceived: true, statementDate: "2026-09-25" });
    expect(v.statementOnTime).toBe(true);
    expect(v.ask).toBe("itemized-receipts");
  });

  test("statement received with no date → treat as on time and ask for receipts", () => {
    const v = checkCharge(legalLease, { ...base, statementReceived: true, statementDate: null });
    expect(v.ask).toBe("itemized-receipts");
  });

  test("deadline math crosses month and year boundaries", () => {
    expect(checkCharge(legalLease, { ...base, moveOutDate: "2026-12-25" }).deadline).toBe("2027-01-08");
  });
});

test("findings show dates in words, not ISO", () => {
  const v = checkCharge(lease({ monthlyRent: 2500, securityDeposit: 2500 }), base);
  expect(v.findings[0].text).toContain("October 14, 2026");
  expect(v.findings[0].text).not.toContain("2026-10-14");
});

test("statement received with no date does not claim it was on time", () => {
  const v = checkCharge(lease({ monthlyRent: 2500, securityDeposit: 2500 }), { ...base, statementReceived: true, statementDate: null });
  expect(v.statementOnTime).toBeNull();
  expect(v.findings[0].text).not.toMatch(/arrived in time|met the deadline/i);
  expect(v.findings[0].text).toContain("October 14, 2026");
});

test("headline never says they met the deadline when the date is unknown", () => {
  const v = checkCharge(lease({ monthlyRent: 2500, securityDeposit: 2500 }), { ...base, statementReceived: true, statementDate: null });
  expect(headline(v)).not.toMatch(/met the deadline/i);
  const onTime = checkCharge(lease({ monthlyRent: 2500, securityDeposit: 2500 }), { ...base, statementReceived: true, statementDate: "2026-10-10" });
  expect(headline(onTime)).toMatch(/met the deadline/i);
});
