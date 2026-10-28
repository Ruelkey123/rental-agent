import { generateText, Output } from "ai";
import { MODEL } from "@/lib/ai";
import { LeaseSchema } from "@/lib/lease-schema";
import { RULES } from "@/lib/rules";

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

const PROMPT = `You are reading a residential lease for a New York City renter.

Extract only what is actually written in the lease. If something isn't in the lease, use null (or an empty list). Never guess or fill in typical values.
Dates must be YYYY-MM-DD. Money is a plain number of dollars.

In aiFlags, list clauses that likely break one of these rules. Use ONLY these rule ids, and quote the clause verbatim:
${Object.values(RULES)
  .map((r) => `- ${r.id}: ${r.plain}`)
  .join("\n")}

If no clause breaks a rule, return an empty aiFlags list. Don't flag a rule just because the lease is silent on it.`;

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error(400, "Please choose a lease PDF to upload.");
  if (file.type !== "application/pdf") return error(400, "That file isn't a PDF. Please upload your lease as a PDF.");
  if (file.size > MAX_BYTES) return error(413, "This file is over 4 MB. Try a smaller scan or export the PDF again.");

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: LeaseSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "file", data: new Uint8Array(await file.arrayBuffer()), mediaType: "application/pdf" },
          ],
        },
      ],
    });
    return Response.json(output);
  } catch (cause) {
    // Log the failure, never the lease.
    console.error("lease extraction failed:", cause instanceof Error ? cause.message : cause);
    return error(502, "The lease reader is unavailable right now. Try again in a minute.");
  }
}
