import { beforeEach, describe, expect, test, vi } from "vitest";
import { checkCharge, type ChargeInput } from "@/lib/charge";
import { lease } from "./fixtures";

const generateText = vi.fn();
vi.mock("ai", async (orig) => ({ ...(await orig<typeof import("ai")>()), generateText }));

const { POST } = await import("@/app/api/letter/route");

const theLease = lease({ monthlyRent: 2500, securityDeposit: 2500, landlordName: "Maple Leaf Realty Holdings LLC" });
const charge: ChargeInput = {
  amountCharged: 1000,
  reason: "Repairs",
  moveOutDate: "2026-09-30",
  statementReceived: false,
  statementDate: null,
  today: "2026-10-28",
};
const verdict = checkCharge(theLease, charge);
const post = (body: unknown) =>
  POST(new Request("http://test/api/letter", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/letter", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  test("an invalid body is a 400", async () => {
    expect((await post({ nope: true })).status).toBe(400);
  });

  test("a model failure is a 502", async () => {
    generateText.mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post({ lease: theLease, charge, verdict })).status).toBe(502);
  });

  test("returns the letter and cites only the rules in the findings", async () => {
    generateText.mockResolvedValue({ text: "Dear Landlord..." });
    const res = await post({ lease: theLease, charge, verdict });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ letter: "Dear Landlord..." });
    const prompt: string = generateText.mock.calls[0][0].prompt;
    expect(prompt).toContain("GOL §7-108".replace("GOL", "Gen. Oblig. Law"));
    expect(prompt).toContain("Maple Leaf Realty Holdings LLC");
    expect(prompt).not.toContain("§238-a");
    expect(prompt).not.toContain("FARE Act");
  });
});
