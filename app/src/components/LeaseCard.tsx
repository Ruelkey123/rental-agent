import type { Lease } from "@/lib/lease-schema";

const money = (n: number | null) => (n == null ? null : `$${n.toLocaleString("en-US")}`);
const day = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-t border-rule py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={value ? "" : "text-muted italic"}>{value ?? "Not found in lease"}</dd>
    </div>
  );
}

export function LeaseCard({ lease }: { lease: Lease }) {
  const term = lease.leaseStart && lease.leaseEnd ? `${day(lease.leaseStart)} to ${day(lease.leaseEnd)}` : null;
  const rent =
    lease.monthlyRent != null
      ? `${money(lease.monthlyRent)} a month${lease.rentDueDay ? `, due on the ${ordinal(lease.rentDueDay)}` : ""}`
      : null;
  return (
    <section aria-labelledby="lease-heading">
      <h2 id="lease-heading" className="mb-2 text-xl font-semibold">
        Your lease
      </h2>
      <dl>
        <Row label="Tenant" value={lease.tenantNames.length ? lease.tenantNames.join(", ") : null} />
        <Row label="Rent" value={rent} />
        <Row label="Term" value={term} />
        <Row label="Security deposit" value={money(lease.securityDeposit)} />
        <Row label="Landlord" value={lease.landlordName} />
        <Row label="Landlord contact" value={lease.landlordContact} />
        <Row label="Repairs" value={lease.repairsResponsibility} />
        <Row label="You pay for" value={lease.utilitiesPaidByTenant.length ? lease.utilitiesPaidByTenant.join(", ") : null} />
        <Row label="Notice to leave" value={lease.tenantNoticeDays != null ? `${lease.tenantNoticeDays} days` : null} />
      </dl>
    </section>
  );
}
