import { describe, expect, test } from "vitest";
import { fetchBuilding } from "@/lib/hpd";

type Rows = Record<string, string>[];

// Routes each SODA query to canned rows by what it selects.
function fakeFetch(rows: { total: Rows; counts: Rows; recent: Rows }, seen: string[] = [], status = 200) {
  return (async (input: string | URL) => {
    const url = decodeURIComponent(String(input));
    seen.push(url);
    const body = url.includes("$group=class") ? rows.counts : url.includes("$order=") ? rows.recent : rows.total;
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
}

describe("fetchBuilding", () => {
  test("summarizes open violations by class", async () => {
    const summary = await fetchBuilding(
      "1520",
      "Sedgwick Avenue",
      "10453",
      fakeFetch({
        total: [{ count: "1039" }],
        counts: [
          { class: "C", count: "70" },
          { class: "B", count: "35" },
        ],
        recent: [{ class: "B", novdescription: "REPAIR THE CEILING", inspectiondate: "2026-07-12T00:00:00.000" }],
      }),
    );
    expect(summary.found).toBe(true);
    expect(summary.open).toEqual({ A: 0, B: 35, C: 70 });
    expect(summary.totalOpen).toBe(105);
    expect(summary.recent).toEqual([{ class: "B", description: "REPAIR THE CEILING", date: "2026-07-12" }]);
    expect(summary.sourceUrl.startsWith("https://")).toBe(true);
  });

  test("an address with no records is not found, not zero violations", async () => {
    const summary = await fetchBuilding("1", "NOWHERE STREET", null, fakeFetch({ total: [{ count: "0" }], counts: [], recent: [] }));
    expect(summary.found).toBe(false);
  });

  test("uppercases input and escapes single quotes", async () => {
    const seen: string[] = [];
    await fetchBuilding("12", "o'brien place", "10001", fakeFetch({ total: [{ count: "0" }], counts: [], recent: [] }, seen));
    expect(seen[0]).toContain("streetname='O''BRIEN PLACE'");
    expect(seen[0]).toContain("zip='10001'");
  });

  test("a non-200 from the city throws", async () => {
    await expect(
      fetchBuilding("1520", "SEDGWICK AVENUE", null, fakeFetch({ total: [], counts: [], recent: [] }, [], 500)),
    ).rejects.toThrow();
  });
});
