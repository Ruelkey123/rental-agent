import { tool } from "ai";
import { z } from "zod";
import { checkDraft } from "./butler";

const sendBack = (stray: string[]) => ({
  ok: false as const,
  error: `Rewrite without citing ${stray.join(", ")}. Keep the request friendly with no legal citations.`,
});

export const butlerTools = {
  draftWorkOrder: tool({
    description: "Draft a friendly repair request (work order) for the renter to email to their landlord or management.",
    inputSchema: z.object({
      subject: z.string().describe("Short email subject, e.g. 'Kitchen faucet dripping in 4B'"),
      body: z.string().describe("Friendly, plain-text email body signed with the tenant's name"),
      urgency: z.enum(["routine", "soon", "urgent"]),
    }),
    execute: async (input) => {
      const check = checkDraft(input.body);
      return check.ok ? { ok: true as const, ...input } : sendBack(check.stray);
    },
  }),
  draftAmenityRequest: tool({
    description: "Draft a polite request to building management to reserve an amenity. The renter sends it; you can't book directly.",
    inputSchema: z.object({
      amenity: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD"),
      time: z.string().describe("e.g. '6 pm' or '2–5 pm'"),
      subject: z.string(),
      body: z.string().describe("Polite, plain-text email body signed with the tenant's name"),
    }),
    execute: async (input) => {
      const check = checkDraft(input.body);
      return check.ok ? { ok: true as const, ...input } : sendBack(check.stray);
    },
  }),
};
