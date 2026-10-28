import { z } from "zod";
import { unknownCitations } from "./citations";

// Every field is nullable: a scanned or non-lease PDF should produce
// "not found", never invented values.
export const LeaseSchema = z.object({
  tenantNames: z.array(z.string()),
  landlordName: z.string().nullable(),
  landlordContact: z.string().nullable().describe("Phone, email, or mailing address for the landlord or manager"),
  address: z
    .object({
      line1: z.string().describe("Street address as written, e.g. '1520 Sedgwick Avenue'"),
      unit: z.string().nullable(),
      houseNumber: z.string().describe("Just the house number, e.g. '1520'"),
      streetName: z
        .string()
        .describe("Street name in NYC HPD style: uppercase, suffix spelled out, e.g. 'SEDGWICK AVENUE', 'WEST 140 STREET'"),
      borough: z.string().nullable(),
      zip: z.string().nullable(),
    })
    .nullable(),
  monthlyRent: z.number().nullable(),
  rentDueDay: z.number().int().nullable().describe("Day of the month rent is due, 1-31"),
  leaseStart: z.string().nullable().describe("YYYY-MM-DD"),
  leaseEnd: z.string().nullable().describe("YYYY-MM-DD"),
  securityDeposit: z.number().nullable(),
  lateFee: z
    .object({
      amount: z.number().nullable().describe("Dollar amount of the late fee"),
      graceDays: z.number().int().nullable().describe("Days after the due date before the fee applies"),
    })
    .nullable(),
  brokerFeePaidByTenant: z.boolean().nullable().describe("True if the lease makes the tenant pay a broker or agent fee"),
  tenantNoticeDays: z.number().int().nullable().describe("Days of notice the tenant must give before leaving"),
  repairsResponsibility: z.string().nullable().describe("One plain sentence on who handles repairs"),
  utilitiesPaidByTenant: z.array(z.string()),
  aiFlags: z.array(
    z.object({
      ruleId: z.string(),
      quote: z.string().describe("The clause, quoted verbatim from the lease"),
      explanation: z.string().describe("One or two plain-English sentences"),
    }),
  ),
});

export type Lease = z.infer<typeof LeaseSchema>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(d: string | null): string | null {
  if (!d || !ISO_DATE.test(d)) return null;
  const parsed = new Date(`${d}T00:00:00Z`);
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d ? d : null;
}

const text = (s: string | null) => (s && s.trim() ? s.trim() : null);

// The model is asked for clean values but isn't guaranteed to return them.
// Anything malformed becomes null so the page shows "Not found" instead of crashing.
export function normalizeLease(lease: Lease): Lease {
  const a = lease.address;
  const address =
    a && text(a.houseNumber) && text(a.streetName)
      ? { ...a, line1: text(a.line1) ?? `${a.houseNumber} ${a.streetName}`, zip: a.zip ? a.zip.trim().slice(0, 5) : null }
      : null;
  const due = lease.rentDueDay;
  return {
    ...lease,
    landlordName: text(lease.landlordName),
    landlordContact: text(lease.landlordContact),
    repairsResponsibility: text(lease.repairsResponsibility),
    tenantNames: lease.tenantNames.filter((n) => n.trim()),
    utilitiesPaidByTenant: lease.utilitiesPaidByTenant.filter((u) => u.trim()),
    address,
    leaseStart: validDate(lease.leaseStart),
    leaseEnd: validDate(lease.leaseEnd),
    rentDueDay: due != null && due >= 1 && due <= 31 ? due : null,
    aiFlags: lease.aiFlags.filter((f) => unknownCitations(f.explanation).length === 0),
  };
}

// True when the extraction found none of the terms that make a lease a lease.
export function looksUnreadable(lease: Lease): boolean {
  return (
    lease.monthlyRent == null && lease.leaseStart == null && lease.leaseEnd == null && lease.securityDeposit == null && lease.address == null
  );
}
