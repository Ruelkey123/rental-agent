import { describe, expect, test } from "vitest";
import { computeFlags } from "@/lib/flags";
import { emptyLease, lease } from "./fixtures";

const ids = (l: ReturnType<typeof lease>) => computeFlags(l).map((f) => f.ruleId);

describe("computeFlags", () => {
  test("flags a deposit over one month's rent", () => {
    expect(ids(lease({ securityDeposit: 5000, monthlyRent: 2500 }))).toContain("deposit-cap");
  });

  test("does not flag a deposit equal to one month's rent", () => {
    expect(ids(lease({ securityDeposit: 2500, monthlyRent: 2500 }))).not.toContain("deposit-cap");
  });

  test("flags a late fee over the $50 cap", () => {
    expect(ids(lease({ monthlyRent: 2500, lateFee: { amount: 150, graceDays: 1 } }))).toContain("late-fee-cap");
  });

  test("flags a late fee charged before 5 days", () => {
    expect(ids(lease({ monthlyRent: 2500, lateFee: { amount: 50, graceDays: 2 } }))).toContain("late-fee-cap");
  });

  test("flags a late fee over 5% when 5% is under $50", () => {
    expect(ids(lease({ monthlyRent: 800, lateFee: { amount: 50, graceDays: 5 } }))).toContain("late-fee-cap");
  });

  test("does not flag a legal late fee", () => {
    expect(ids(lease({ monthlyRent: 2500, lateFee: { amount: 50, graceDays: 5 } }))).not.toContain("late-fee-cap");
  });

  test("flags a broker fee charged to the tenant", () => {
    expect(ids(lease({ brokerFeePaidByTenant: true }))).toContain("broker-fee-fare-act");
  });

  test("drops AI flags that cite an unknown rule", () => {
    const flags = computeFlags(lease({ aiFlags: [{ ruleId: "made-up", quote: "x", explanation: "y" }] }));
    expect(flags).toEqual([]);
  });

  test("dedupes an AI flag against the deterministic check, keeping the check", () => {
    const flags = computeFlags(
      lease({
        securityDeposit: 5000,
        monthlyRent: 2500,
        aiFlags: [{ ruleId: "deposit-cap", quote: "Deposit: $5,000", explanation: "too high" }],
      }),
    );
    const deposit = flags.filter((f) => f.ruleId === "deposit-cap");
    expect(deposit).toHaveLength(1);
    expect(deposit[0].source).toBe("check");
    expect(deposit[0].quote).toBe("Deposit: $5,000");
  });

  test("keeps a valid AI flag with no matching check", () => {
    const flags = computeFlags(
      lease({ aiFlags: [{ ruleId: "habitability", quote: "Tenant waives all repair claims", explanation: "can't waive" }] }),
    );
    expect(flags).toEqual([
      { ruleId: "habitability", quote: "Tenant waives all repair claims", explanation: "can't waive", source: "ai" },
    ]);
  });

  test("an all-null lease returns no flags and does not throw", () => {
    expect(computeFlags(emptyLease())).toEqual([]);
  });

  test("a late fee with no grace period says so in words", () => {
    const flag = computeFlags(lease({ monthlyRent: 2500, lateFee: { amount: 150, graceDays: 0 } }))[0];
    expect(flag.explanation).toContain("right away");
    expect(flag.explanation).not.toContain("0 days");
  });
});
