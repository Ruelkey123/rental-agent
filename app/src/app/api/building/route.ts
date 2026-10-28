import { fetchBuilding } from "@/lib/hpd";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const house = params.get("house");
  const street = params.get("street");
  if (!house || !street) return Response.json({ error: "An address is needed to check the building." }, { status: 400 });

  try {
    return Response.json(await fetchBuilding(house, street, params.get("zip")));
  } catch (cause) {
    console.error("building check failed:", cause instanceof Error ? cause.message : cause);
    return Response.json({ error: "NYC's building records aren't responding right now." }, { status: 502 });
  }
}
