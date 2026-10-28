import type { Lease } from "./lease-schema";
import { isRuleId, type RuleId } from "./rules";

export type Flag = {
  ruleId: RuleId;
  quote: string | null;
  explanation: string;
  source: "check" | "ai";
};

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function deterministicFlags(lease: Lease): Flag[] {
  const flags: Flag[] = [];
  const rent = lease.monthlyRent;

  if (rent != null && lease.securityDeposit != null && lease.securityDeposit > rent) {
    flags.push({
      ruleId: "deposit-cap",
      quote: null,
      explanation: `Your deposit is ${money(lease.securityDeposit)} but rent is ${money(rent)}. NY caps deposits at one month's rent, so up to ${money(lease.securityDeposit - rent)} may be illegal.`,
      source: "check",
    });
  }

  const fee = lease.lateFee;
  if (fee) {
    const cap = rent != null ? Math.min(50, rent * 0.05) : 50;
    const tooHigh = fee.amount != null && fee.amount > cap;
    const tooSoon = fee.graceDays != null && fee.graceDays < 5;
    if (tooHigh || tooSoon) {
      const reasons = [
        tooHigh && `${money(fee.amount!)} is over the ${money(cap)} cap`,
        tooSoon && `it kicks in after ${fee.graceDays} day${fee.graceDays === 1 ? "" : "s"} instead of 5`,
      ].filter(Boolean);
      flags.push({
        ruleId: "late-fee-cap",
        quote: null,
        explanation: `This late fee breaks NY's limits: ${reasons.join(", and ")}.`,
        source: "check",
      });
    }
  }

  if (lease.brokerFeePaidByTenant) {
    flags.push({
      ruleId: "broker-fee-fare-act",
      quote: null,
      explanation: "The lease makes you pay a broker fee. Under the FARE Act, you can't be charged for a broker the landlord hired.",
      source: "check",
    });
  }

  return flags;
}

export function computeFlags(lease: Lease): Flag[] {
  const flags = deterministicFlags(lease);
  for (const ai of lease.aiFlags) {
    if (!isRuleId(ai.ruleId)) continue;
    const existing = flags.find((f) => f.ruleId === ai.ruleId);
    if (existing) {
      existing.quote ??= ai.quote;
      continue;
    }
    flags.push({ ruleId: ai.ruleId, quote: ai.quote, explanation: ai.explanation, source: "ai" });
  }
  return flags;
}
