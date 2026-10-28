import type { Lease } from "@/lib/lease-schema";

export function emptyLease(): Lease {
  return {
    tenantNames: [],
    landlordName: null,
    landlordContact: null,
    address: null,
    monthlyRent: null,
    rentDueDay: null,
    leaseStart: null,
    leaseEnd: null,
    securityDeposit: null,
    lateFee: null,
    brokerFeePaidByTenant: null,
    tenantNoticeDays: null,
    repairsResponsibility: null,
    utilitiesPaidByTenant: [],
    aiFlags: [],
  };
}

export function lease(overrides: Partial<Lease> = {}): Lease {
  return { ...emptyLease(), ...overrides };
}
