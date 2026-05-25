// Thailand address data — lazy-fetched from /thailand-address.json (public folder)
// Cached after first load so subsequent calls are instant.

export type SubdistrictEntry = { name: string; zipcode: string };
export type DistrictEntry = { name: string; subdistricts: SubdistrictEntry[] };
export type ProvinceEntry = { name: string; districts: DistrictEntry[] };

type RawEntry = {
  zipcode: number;
  province_th: string;
  district_th: string;
  subdistrict_th: string;
};

let _cache: ProvinceEntry[] | null = null;

function buildHierarchy(raw: RawEntry[]): ProvinceEntry[] {
  const map: Record<string, Record<string, SubdistrictEntry[]>> = {};
  for (const entry of raw) {
    const p = entry.province_th;
    const d = entry.district_th;
    const s = entry.subdistrict_th;
    const z = String(entry.zipcode);
    if (!map[p]) map[p] = {};
    if (!map[p][d]) map[p][d] = [];
    map[p][d].push({ name: s, zipcode: z });
  }
  return Object.entries(map).map(([pname, districts]) => ({
    name: pname,
    districts: Object.entries(districts).map(([dname, subdistricts]) => ({
      name: dname,
      subdistricts,
    })),
  }));
}

export async function getThaiAddress(): Promise<ProvinceEntry[]> {
  if (_cache) return _cache;
  const res = await fetch("/thailand-address.json");
  const raw: RawEntry[] = await res.json();
  _cache = buildHierarchy(raw);
  return _cache;
}
