import { unknownCitations } from "./citations";
import type { Lease } from "./lease-schema";
import { RULES } from "./rules";
import type { TimelineEvent } from "./timeline";

export function extractEmail(contact: string | null): string | null {
  return contact?.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? null;
}

export function mailtoLink(to: string | null, subject: string, body: string): string {
  return `mailto:${to ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Drafts go to the landlord, so any law they mention must come from our checked list.
export function checkDraft(body: string): { ok: boolean; stray: string[] } {
  const stray = unknownCitations(body);
  return { ok: stray.length === 0, stray };
}

export function amenityEvent(req: { amenity: string; date: string; time: string }): TimelineEvent {
  return {
    id: `amenity-${req.date}`,
    date: req.date,
    title: `${req.amenity} (requested), ${req.time}`,
    agentHelp: "Requested through Rental Agent. Check that management confirmed it.",
  };
}

const weekday = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

export function systemPrompt(lease: Lease, today: string): string {
  const a = lease.address;
  const facts = [
    `Tenant: ${lease.tenantNames.join(", ") || "unknown"}`,
    `Apartment: ${a ? `${a.line1}${a.unit ? `, ${a.unit}` : ""}, ${a.borough ?? ""} ${a.zip ?? ""}` : "unknown"}`,
    `Landlord: ${lease.landlordName ?? "unknown"}`,
    `Landlord contact: ${lease.landlordContact ?? "unknown"}`,
    `Rent: ${lease.monthlyRent != null ? `$${lease.monthlyRent}/month, due day ${lease.rentDueDay ?? "?"}` : "unknown"}`,
    `Lease: ${lease.leaseStart ?? "?"} to ${lease.leaseEnd ?? "?"}`,
    `Repairs: ${lease.repairsResponsibility ?? "unknown"}`,
    `Tenant pays for: ${lease.utilitiesPaidByTenant.join(", ") || "unknown"}`,
    `Notice to leave: ${lease.tenantNoticeDays != null ? `${lease.tenantNoticeDays} days` : "unknown"}`,
  ].join("\n");

  return `You are Rental Agent, a warm, capable personal butler for a New York City renter. Your job is peace of mind: handle the small stuff, and make sure they understand their power when something bigger goes wrong.

Today is ${weekday(today)}, ${today}.

What you know about their rental:
${facts}

How to help:
- Repairs: ask at most one or two quick follow-ups if you truly need them (where exactly, how long, how bad), then call draftWorkOrder. Keep the request friendly and neighborly, like a good tenant writing to a good landlord. Never threatening, and no legal language or citations in the request.
- Serious problems (no heat or hot water, leaks or flooding, mold, pests, a broken lock or door, no electricity or gas, anything unsafe): still draft a friendly request marked urgent. Then, in your chat reply (not in the request), briefly tell the renter their rights so they feel confident, using only the rules below.
- Amenities (grill, roof, gym, laundry, party room, bike storage, guest parking): you can't book with the building's system directly, so say so plainly, then call draftAmenityRequest with a polite request to management. Resolve words like "Saturday" into a real date (YYYY-MM-DD).
- Questions about the lease: answer from the facts above. If something isn't there, say you don't see it in their lease.
- Be brief. Two or three short sentences per reply, plain English, no markdown headings or bold.

Rules you may mention (never cite any other law, code, or case):
${Object.values(RULES)
  .map((r) => `- ${r.title} (${r.citation}): ${r.plain}`)
  .join("\n")}

Sign drafts with the tenant's name. Address them to the landlord or management by name when you know it.`;
}
