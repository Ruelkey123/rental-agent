import { generateText } from "ai";
import { z } from "zod";
import { MODEL } from "@/lib/ai";
import { checkCharge } from "@/lib/charge";
import { unknownCitations } from "@/lib/citations";
import { LeaseSchema } from "@/lib/lease-schema";
import { RULES } from "@/lib/rules";

export const maxDuration = 60;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const BodySchema = z.object({
  lease: LeaseSchema,
  charge: z.object({
    amountCharged: z.number().nonnegative(),
    reason: z.string().max(500),
    moveOutDate: date,
    statementReceived: z.boolean(),
    statementDate: date.nullable(),
    today: date,
  }),
});

const ASKS = {
  "return-full-deposit": "Demand return of the full security deposit, because the landlord missed the legal deadline.",
  "itemized-receipts":
    "Ask the landlord to back every deduction with receipts, invoices, or estimates, and to return anything they can't document.",
  wait: "Remind the landlord of the itemized-statement deadline and ask them to confirm they'll meet it.",
};

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Something's missing from the charge details." }, { status: 400 });
  const { lease, charge } = parsed.data;

  // Recompute on the server so the letter never rests on a verdict the client made up.
  const verdict = checkCharge(lease, charge);
  const rules = verdict.findings.map((f) => {
    const r = RULES[f.ruleId];
    return `- ${r.title} (${r.citation}): ${r.plain} In this case: ${f.text}`;
  });

  const prompt = `Write a letter from a New York City tenant to their former landlord about a security deposit charge.

Facts:
- Tenant: ${lease.tenantNames.join(" and ") || "[Tenant name]"}
- Landlord: ${lease.landlordName ?? "[Landlord name]"}
- Apartment: ${lease.address ? `${lease.address.line1}${lease.address.unit ? `, ${lease.address.unit}` : ""}` : "[Apartment address]"}
- Security deposit paid: ${lease.securityDeposit != null ? `$${lease.securityDeposit}` : "[deposit amount]"}
- Amount the landlord is charging or keeping: $${charge.amountCharged}, for: ${charge.reason || "[reason given]"}
- Move-out date: ${charge.moveOutDate}
- Itemized statement received: ${charge.statementReceived ? `yes${charge.statementDate ? `, on ${charge.statementDate}` : ""}` : "no"}
- Today: ${charge.today}

Rules that apply (cite ONLY these, by their citation):
${rules.join("\n")}

What the letter asks for: ${ASKS[verdict.ask]}

Style: firm, polite, plain English. Under 300 words. Ask for a response within 10 days. Use [brackets] for anything unknown, like the tenant's forwarding address. Don't cite any law not listed above, and don't threaten anything beyond what those rules say. Output only the letter, as plain text with no markdown.`;

  try {
    // Prompting alone can't guarantee the model stays inside our rules, so check, and retry once.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { text: raw } = await generateText({ model: MODEL, prompt });
      const text = raw.replace(/\*\*(.+?)\*\*/g, "$1");
      const stray = unknownCitations(text);
      if (stray.length === 0) return Response.json({ letter: text });
      console.error("letter cited law outside RULES:", stray.join(", "));
    }
    throw new Error("letter kept citing law outside RULES");
  } catch (cause) {
    console.error("letter drafting failed:", cause instanceof Error ? cause.message : cause);
    return Response.json({ error: "The letter writer is unavailable right now. Try again in a minute." }, { status: 502 });
  }
}
