import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream, type UIMessage } from "ai";
import { MODEL } from "@/lib/ai";
import { systemPrompt } from "@/lib/butler";
import { butlerTools } from "@/lib/butler-tools";
import { todayISO } from "@/lib/dates";
import { LeaseSchema } from "@/lib/lease-schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lease = LeaseSchema.safeParse(body?.lease);
  if (!lease.success || !Array.isArray(body?.messages)) {
    return Response.json({ error: "Upload your lease first so I know your apartment." }, { status: 400 });
  }

  const result = streamText({
    model: MODEL,
    system: systemPrompt(lease.data, body.today ?? todayISO()),
    messages: await convertToModelMessages(body.messages as UIMessage[]),
    tools: butlerTools,
    stopWhen: isStepCount(4),
    onError: ({ error }) => console.error("chat failed:", error instanceof Error ? error.message : error),
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
