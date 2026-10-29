"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { BuildingCheck } from "@/components/BuildingCheck";
import { ButlerChat } from "@/components/ButlerChat";
import { Disclaimer } from "@/components/Disclaimer";
import { FlagList } from "@/components/FlagList";
import { LeaseCard } from "@/components/LeaseCard";
import { Shell } from "@/components/Shell";
import { Timeline } from "@/components/Timeline";
import { computeFlags } from "@/lib/flags";
import { looksUnreadable } from "@/lib/lease-schema";
import { clearLease } from "@/lib/storage";
import { buildTimeline } from "@/lib/timeline";
import { useLease } from "@/lib/use-lease";

export default function RentalPage() {
  const lease = useLease();
  const router = useRouter();
  const flags = useMemo(() => (lease ? computeFlags(lease) : []), [lease]);
  const events = useMemo(() => (lease ? buildTimeline(lease) : []), [lease]);

  if (!lease) return <Shell><p className="pt-10 text-muted">Loading your rental…</p></Shell>;

  if (looksUnreadable(lease)) {
    return (
      <Shell>
        <section className="pt-10" role="alert">
          <h1 className="text-3xl font-semibold tracking-tight">We couldn&rsquo;t read lease terms from this PDF</h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
            We didn&rsquo;t find rent, dates, a deposit, or an address. If it&rsquo;s a photo or a scan, try a clearer copy or the
            PDF your landlord emailed you. If it isn&rsquo;t a lease, upload the lease instead.
          </p>
          <button
            type="button"
            onClick={() => {
              clearLease();
              router.push("/");
            }}
            className="mt-6 rounded-md bg-ink px-4 py-2.5 font-medium text-paper hover:opacity-90"
          >
            Upload a different PDF
          </button>
        </section>
        <Disclaimer />
      </Shell>
    );
  }

  const where = lease.address ? `${lease.address.line1}${lease.address.unit ? `, ${lease.address.unit}` : ""}` : "Your rental";

  return (
    <Shell>
      <section className="pt-8 pb-6">
        <p className="text-muted">Your rental</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{where}</h1>
      </section>

      <div className="space-y-14">
        <ButlerChat lease={lease} />
        <FlagList flags={flags} />
        <Timeline events={events} leaseEnd={lease.leaseEnd} />
        <BuildingCheck address={lease.address} />

        <section aria-labelledby="help-heading">
          <h2 id="help-heading" className="text-xl font-semibold">
            When something comes up
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link href="/rental/charge" className="rounded-md bg-ink p-5 text-paper hover:opacity-90">
              <p className="font-semibold">They&rsquo;re charging me</p>
              <p className="mt-1 text-sm opacity-80">Check a deposit deduction against the rules and get a letter to send.</p>
            </Link>
            <a href="#butler-heading" className="rounded-md border border-ink/25 p-5 hover:bg-wash">
              <p className="font-semibold">Something broke, or I need something</p>
              <p className="mt-1 text-sm text-muted">Tell your rental agent. It writes the work order or amenity request for you.</p>
            </a>
          </div>
        </section>
        <LeaseCard lease={lease} />
      </div>

      <button
        type="button"
        onClick={() => {
          clearLease();
          router.push("/");
        }}
        className="mt-14 text-sm text-muted underline"
      >
        Start over with a different lease
      </button>
      <Disclaimer />
    </Shell>
  );
}
