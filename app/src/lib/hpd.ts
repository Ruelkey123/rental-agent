const DATASET = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";
const SOURCE_PAGE = "https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Violations/wvxf-dwi5";

export interface BuildingSummary {
  found: boolean;
  open: { A: number; B: number; C: number };
  totalOpen: number;
  recent: { class: string; description: string; date: string }[];
  sourceUrl: string;
}

const quote = (s: string) => `'${s.trim().toUpperCase().replaceAll("'", "''")}'`;

export async function fetchBuilding(
  houseNumber: string,
  streetName: string,
  zip: string | null,
  fetchFn: typeof fetch = fetch,
): Promise<BuildingSummary> {
  const where = [`housenumber=${quote(houseNumber)}`, `streetname=${quote(streetName)}`, zip && `zip=${quote(zip)}`]
    .filter(Boolean)
    .join(" AND ");
  const openWhere = `${where} AND violationstatus='Open'`;

  const query = async (params: Record<string, string>) => {
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    const res = await fetchFn(`${DATASET}?${qs}`);
    if (!res.ok) throw new Error(`NYC Open Data returned ${res.status}`);
    return (await res.json()) as Record<string, string>[];
  };

  const [total, counts, recent] = await Promise.all([
    query({ $select: "count(*)", $where: where }),
    query({ $select: "class,count(*)", $where: openWhere, $group: "class" }),
    query({ $select: "class,novdescription,inspectiondate", $where: openWhere, $order: "inspectiondate DESC", $limit: "3" }),
  ]);

  const open = { A: 0, B: 0, C: 0 };
  for (const row of counts) {
    if (row.class === "A" || row.class === "B" || row.class === "C") open[row.class] = Number(row.count);
  }

  return {
    found: Number(total[0]?.count ?? 0) > 0,
    open,
    totalOpen: open.A + open.B + open.C,
    recent: recent.map((r) => ({
      class: r.class,
      description: r.novdescription,
      date: (r.inspectiondate ?? "").slice(0, 10),
    })),
    sourceUrl: SOURCE_PAGE,
  };
}
