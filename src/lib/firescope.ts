export type SensorId = "MODIS_AQUA" | "MODIS_TERRA" | "VIIRS_NOAA20" | "VIIRS_NOAA21" | "VIIRS_SNPP";

export const SENSORS: { id: SensorId; label: string; instrument: string; color: string }[] = [
  { id: "MODIS_AQUA", label: "MODIS Aqua", instrument: "MODIS · 1 km", color: "oklch(0.78 0.16 70)" },
  { id: "MODIS_TERRA", label: "MODIS Terra", instrument: "MODIS · 1 km", color: "oklch(0.68 0.2 40)" },
  { id: "VIIRS_NOAA20", label: "VIIRS NOAA-20", instrument: "VIIRS · 375 m", color: "oklch(0.75 0.13 220)" },
  { id: "VIIRS_NOAA21", label: "VIIRS NOAA-21", instrument: "VIIRS · 375 m", color: "oklch(0.8 0.12 170)" },
  { id: "VIIRS_SNPP", label: "VIIRS S-NPP", instrument: "VIIRS · 375 m", color: "oklch(0.85 0.05 260)" },
];

/** The only dates with observations in the pilot. Any other date is "No Data". */
export const AVAILABLE_DATES = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "2025-12-30"];
export const TOTAL_OBSERVATIONS = 156810;

/** Raw 1° cell per date × sensor. b = sensor-specific brightness (MODIS brightness / VIIRS bright_ti4), null if missing. */
export type RawCell = { d: string; s: SensorId; la: number; lo: number; n: number; f: number | null; mx: number | null; b: number | null; nn: number };

export type Cell = {
  key: string; la: number; lo: number; n: number; meanFrp: number | null; maxFrp: number | null; night: number;
  bySensor: Partial<Record<SensorId, { n: number; meanFrp: number | null; brightness: number | null }>>;
};

let cache: Promise<RawCell[]> | null = null;
export function loadGrid(): Promise<RawCell[]> {
  if (!cache) cache = fetch("/data/grid.json").then((r) => r.json());
  return cache;
}

/** Aggregate raw rows into cells. FRP means are observation-weighted over rows that have FRP; missing stays null. */
export function aggregate(rows: RawCell[], date: string | "all", sensors: SensorId[]): Cell[] {
  const m = new Map<string, Cell & { _fs: number; _fn: number }>();
  for (const r of rows) {
    if (date !== "all" && r.d !== date) continue;
    if (!sensors.includes(r.s)) continue;
    const key = `${r.la},${r.lo}`;
    let c = m.get(key);
    if (!c) { c = { key, la: r.la, lo: r.lo, n: 0, meanFrp: null, maxFrp: null, night: 0, bySensor: {}, _fs: 0, _fn: 0 }; m.set(key, c); }
    c.n += r.n; c.night += r.nn;
    if (r.f != null) { c._fs += r.f * r.n; c._fn += r.n; }
    if (r.mx != null) c.maxFrp = Math.max(c.maxFrp ?? 0, r.mx);
    const prev = c.bySensor[r.s];
    if (!prev) c.bySensor[r.s] = { n: r.n, meanFrp: r.f, brightness: r.b };
    else {
      const n = prev.n + r.n;
      prev.meanFrp = prev.meanFrp != null && r.f != null ? (prev.meanFrp * prev.n + r.f * r.n) / n : prev.meanFrp ?? r.f;
      prev.brightness = prev.brightness != null && r.b != null ? (prev.brightness * prev.n + r.b * r.n) / n : prev.brightness ?? r.b;
      prev.n = n;
    }
  }
  return [...m.values()].map(({ _fs, _fn, ...c }) => ({ ...c, meanFrp: _fn ? _fs / _fn : null }));
}

export function hasData(date: string) { return date === "all" || AVAILABLE_DATES.includes(date); }

export const fmt = (v: number | null | undefined, d = 1) => (v == null || Number.isNaN(v) ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));
export const fmtInt = (v: number) => v.toLocaleString();

export async function loadCsv(path: string): Promise<any[]> {
  const t = await (await fetch(path)).text();
  const [h, ...lines] = t.trim().split(/\r?\n/);
  const cols = (h ?? "").split(",");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i] ?? "", v])));
}
