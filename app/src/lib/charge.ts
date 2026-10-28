import { addDays } from "./dates";
import type { Lease } from "./lease-schema";
import type { RuleId } from "./rules";

export interface ChargeInput {
  amountCharged: number;
  reason: string;
  moveOutDate: string;
  statementReceived: boolean;
  statementDate: string | null;
  today: string;
}

export interface ChargeVerdict {
  deadline: string;
  deadlinePassed: boolean;
  statementOnTime: boolean | null;
  depositOverCap: boolean;
  findings: { ruleId: RuleId; text: string }[];
  ask: "return-full-deposit" | "itemized-receipts" | "wait";
}

export function checkCharge(lease: Lease, input: ChargeInput): ChargeVerdict {
  const deadline = addDays(input.moveOutDate, 14);
  const deadlinePassed = input.today > deadline;
  const findings: ChargeVerdict["findings"] = [];

  let statementOnTime: boolean | null = null;
  let ask: ChargeVerdict["ask"];

  if (input.statementReceived) {
    statementOnTime = input.statementDate == null ? null : input.statementDate <= deadline;
    if (statementOnTime === false) {
      ask = "return-full-deposit";
      findings.push(
        { ruleId: "itemized-14-days", text: `The itemized statement came on ${input.statementDate}, after the ${deadline} deadline.` },
        { ruleId: "forfeit-if-late", text: "Because it was late, the landlord lost the right to keep any of the deposit." },
      );
    } else {
      ask = "itemized-receipts";
      findings.push({
        ruleId: "itemized-14-days",
        text: "The statement arrived in time, so the landlord can deduct real damage. Ask them to back every charge with receipts or invoices.",
      });
    }
  } else if (deadlinePassed) {
    ask = "return-full-deposit";
    findings.push(
      { ruleId: "itemized-14-days", text: `The landlord had until ${deadline} to send an itemized statement, and you haven't received one.` },
      { ruleId: "forfeit-if-late", text: "Missing that deadline means they lost the right to keep any of the deposit." },
    );
  } else {
    ask = "wait";
    findings.push({
      ruleId: "itemized-14-days",
      text: `The landlord has until ${deadline} to send an itemized statement. If nothing arrives by then, they must return the full deposit.`,
    });
  }

  const depositOverCap =
    lease.securityDeposit != null && lease.monthlyRent != null && lease.securityDeposit > lease.monthlyRent;
  if (depositOverCap) {
    findings.push({
      ruleId: "deposit-cap",
      text: `Your $${lease.securityDeposit!.toLocaleString("en-US")} deposit was more than one month's rent, which NY doesn't allow. The excess should come back regardless.`,
    });
  }

  return { deadline, deadlinePassed, statementOnTime, depositOverCap, findings, ask };
}
