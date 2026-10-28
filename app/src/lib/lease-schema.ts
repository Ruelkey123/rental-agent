import { z } from "zod";

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
