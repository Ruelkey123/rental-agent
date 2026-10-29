import { beforeEach, describe, expect, test, vi } from "vitest";
import { lease } from "./fixtures";

const generateText = vi.fn();
vi.mock("ai", async (orig) => ({ ...(await orig<typeof import("ai")>()), generateText }));

const { POST } = await import("@/app/api/lease/route");

function upload(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("http://test/api/lease", { method: "POST", body: form });
}
const pdf = (bytes: number) => new File([new Uint8Array(bytes)], "lease.pdf", { type: "application/pdf" });

describe("POST /api/lease", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  test("missing file is a 400", async () => {
    expect((await POST(upload())).status).toBe(400);
  });

  test("non-PDF is a 400", async () => {
    const res = await POST(upload(new File(["hi"], "a.txt", { type: "text/plain" })));
    expect(res.status).toBe(400);
  });

  test("a 5 MB PDF is a 413", async () => {
    expect((await POST(upload(pdf(5 * 1024 * 1024)))).status).toBe(413);
  });

  test("a model failure is a 502 with a readable error", async () => {
    generateText.mockRejectedValue(new Error("gateway down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(upload(pdf(1000)));
    expect(res.status).toBe(502);
    expect(typeof (await res.json()).error).toBe("string");
  });

  test("happy path returns the extracted lease", async () => {
    const extracted = lease({ monthlyRent: 2500, securityDeposit: 5000 });
    generateText.mockResolvedValue({ output: extracted });
    const res = await POST(upload(pdf(1000)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(extracted);
    const call = generateText.mock.calls[0][0];
    expect(call.model).toBe("google/gemini-2.5-flash");
    expect(call.messages[0].content[1]).toMatchObject({ type: "file", mediaType: "application/pdf" });
  });

  test("malformed model values are normalized before they reach the browser", async () => {
    generateText.mockResolvedValue({ output: lease({ leaseEnd: "2027-01", landlordName: "" }) });
    const body = await (await POST(upload(pdf(1000)))).json();
    expect(body.leaseEnd).toBeNull();
    expect(body.landlordName).toBeNull();
  });
});
