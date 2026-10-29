import { describe, expect, test, vi } from "vitest";
import { butlerTools } from "@/lib/butler-tools";

vi.mock("ai", async (orig) => ({ ...(await orig<typeof import("ai")>()), streamText: vi.fn() }));
const { POST } = await import("@/app/api/chat/route");

const opts = { toolCallId: "t1", messages: [] } as never;

describe("butler tools", () => {
  test("a friendly work order comes back ready to send", async () => {
    const out = await butlerTools.draftWorkOrder.execute!(
      { subject: "Kitchen faucet dripping", body: "Hi! The kitchen faucet in 4B is dripping.", urgency: "routine" },
      opts,
    );
    expect(out).toMatchObject({ ok: true, subject: "Kitchen faucet dripping", urgency: "routine" });
  });

  test("a work order citing outside law is sent back to the model", async () => {
    const out = await butlerTools.draftWorkOrder.execute!(
      { subject: "Heat", body: "Under Admin Code §27-2029 you must fix the heat.", urgency: "urgent" },
      opts,
    );
    expect(out).toMatchObject({ ok: false });
  });

  test("an amenity request carries its date and time", async () => {
    const out = await butlerTools.draftAmenityRequest.execute!(
      { amenity: "Rooftop grill", date: "2026-11-07", time: "6 pm", subject: "Grill request", body: "Hi! Could I reserve the grill?" },
      opts,
    );
    expect(out).toMatchObject({ ok: true, amenity: "Rooftop grill", date: "2026-11-07" });
  });
});

describe("POST /api/chat", () => {
  test("a request without a valid lease is a 400", async () => {
    const res = await POST(new Request("http://test/api/chat", { method: "POST", body: JSON.stringify({ messages: [] }) }));
    expect(res.status).toBe(400);
  });
});
