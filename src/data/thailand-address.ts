// Thailand address data sourced from the `thailand-address` npm package (compressed.json)
// Shape from the package: flat records with { province_th, district_th, subdistrict_th, zipcode }
// We transform once at import time into a hierarchical structure for cascading dropdowns.

import rawDb from "thailand-address/lib/database/compressed.json";

export type SubdistrictEntry = { name: string; zipcode: string };
export type DistrictEntry = { name: string; subdistricts: SubdistrictEntry[] };
export type ProvinceEntry = { name: string; districts: DistrictEntry[] };

type RawEntry = {
  zipcode: number;
  province_th: string;
  district_th: string;
  subdistrict_th: string;
};

function buildHierarchy(): ProvinceEntry[] {
  const map: Record<string, Record<string, SubdistrictEntry[]>> = {};

  for (const entry of Object.values(rawDb) as RawEntry[]) {
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

// Built once synchronously at module load — no network requests needed
export const thaiAddress: ProvinceEntry[] = buildHierarchy();

// Keep async wrapper for backward compatibility with any existing callers
export async function getThaiAddress(): Promise<ProvinceEntry[]> {
  return thaiAddress;
}
