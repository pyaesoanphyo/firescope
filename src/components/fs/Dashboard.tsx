import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Search, X } from "lucide-react";
import { AppShell } from "./AppShell";
import { Globe, type GlobeApi } from "./Globe";
import { AVAILABLE_DATES, SENSORS, aggregate, fmt, fmtInt, hasData, loadGrid, type RawCell, type SensorId } from "@/lib/firescope";

const ALL = SENSORS.map((s) => s.id);

export function Dashboard() {
  const [rows, setRows] = useState<RawCell[] | null>(null);
  const [date, setDate] = useState<string>("2024-01-01");
  const [sensors, setSensors] = useState<SensorId[]>(ALL);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState("");
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const [utc, setUtc] = useState<Date | null>(null);
  const api = useRef<GlobeApi | null>(null);

  useEffect(() => { loadGrid().then(setRows); }, []);
  const cells = useMemo(() => (rows && hasData(date) ? aggregate(rows, date, sensors) : []), [rows, date, sensors]);
  const total = cells.reduce((a, c) => a + c.n, 0);
  const sel = cells.find((c) => c.key === selected) ?? null;
  const region = useMemo(() => {
    if (!sel) return null;
    const rc = cells.filter((c) => Math.abs(c.la - sel.la) <= 5 && Math.abs(c.lo - sel.lo) <= 5);
    const n = rc.reduce((a, c) => a + c.n, 0);
    const fn = rc.filter((c) => c.meanFrp != null);
    const fw = fn.reduce((a, c) => a + c.n, 0);
    return { cells: rc.length, n, meanFrp: fw ? fn.reduce((a, c) => a + c.meanFrp! * c.n, 0) / fw : null };
  }, [sel, cells]);

  const perDate = useMemo(() => {
    const m: Record<string, Partial<Record<SensorId, number>>> = {};
    rows?.forEach((r) => { if (!sensors.includes(r.s)) return; const o = (m[r.d] ??= {}); o[r.s] = (o[r.s] ?? 0) + r.n; });
    return m;
  }, [rows, sensors]);
  const maxDay = Math.max(1, ...Object.values(perDate).map((o) => Object.values(o).reduce((a, b) => a + (b ?? 0), 0)));

  const idx = AVAILABLE_DATES.indexOf(date);
  const step = (d: number) => { const i = idx < 0 ? 0 : (idx + d + AVAILABLE_DATES.length) % AVAILABLE_DATES.length; setDate(AVAILABLE_DATES[i] ?? AVAILABLE_DATES[0]!); };
  useEffect(() => { if (!playing) return; const t = setInterval(() => step(1), 2200); return () => clearInterval(t); });

  async function search(e: React.FormEvent) {
    e.preventDefault(); if (!q.trim()) return;
    setSearchMsg("Searching…");
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (!j[0]) { setSearchMsg("Location not found"); return; }
      api.current?.flyTo(+j[0].lon, +j[0].lat, 2.5e6); setSearchMsg(j[0].display_name.split(",").slice(0, 2).join(","));
    } catch { setSearchMsg("Search unavailable"); }
  }

  const toggle = (s: SensorId) => setSensors((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const noData = !hasData(date);

  return (
    <AppShell>
      <Globe cells={cells} selected={selected} onSelect={setSelected} onReady={(a) => (api.current = a)} onTime={setUtc} />

      {/* Top controls */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start gap-3">
        <div className="panel pointer-events-auto flex items-center gap-2 px-3 py-2">
          <span className="label-caps">Date</span>
          <button onClick={() => step(-1)} className="rounded p-1 hover:bg-secondary" aria-label="Previous date"><ChevronLeft className="h-4 w-4" /></button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded bg-secondary px-2 py-1 font-mono text-sm text-foreground outline-none [color-scheme:dark]" />
          <button onClick={() => step(1)} className="rounded p-1 hover:bg-secondary" aria-label="Next date"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setPlaying((p) => !p)} className="rounded bg-primary p-1.5 text-primary-foreground" aria-label="Play">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="panel pointer-events-auto flex flex-wrap items-center gap-1.5 px-3 py-2">
          <span className="label-caps mr-1">Sensor</span>
          {SENSORS.map((s) => {
            const on = sensors.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${on ? "border-border bg-secondary text-foreground" : "border-transparent text-muted-foreground opacity-50"}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={search} className="panel pointer-events-auto ml-auto flex items-center gap-2 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search location"
            className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          {searchMsg && <span className="max-w-40 truncate text-xs text-muted-foreground">{searchMsg}</span>}
        </form>
      </div>

      {/* No data overlay */}
      {noData && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="panel px-6 py-4 text-center">
            <div className="text-2xl font-semibold">No Data</div>
            <div className="mt-1 text-sm text-muted-foreground">No observations in the pilot for {date}. This is not zero fire activity.</div>
          </div>
        </div>
      )}

      {/* Left-bottom legend */}
      <div className="panel absolute bottom-36 left-4 w-60 space-y-3 p-3">
        <div>
          <div className="label-caps mb-1.5">Mean FRP (MW) · color</div>
          <div className="bg-fire-gradient h-2 rounded-full" />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>1</span><span>20</span><span>200+</span></div>
          <div className="label-caps mt-2">Marker size · observations per 1° cell</div>
        </div>
        <div className="space-y-1">
          <div className="label-caps">Sensors</div>
          {SENSORS.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-mono text-muted-foreground">{s.instrument}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="panel absolute right-4 top-28 w-72 space-y-4 p-4">
        <div>
          <div className="label-caps">Current view</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{noData ? "No Data" : fmtInt(total)}</div>
          <div className="text-xs text-muted-foreground">{noData ? date : `observations · ${fmtInt(cells.length)} grid cells · ${date}`}</div>
          {utc && <div className="mt-2 font-mono text-[10px] text-muted-foreground">SUN POSITION · {utc.toISOString().slice(0, 16).replace("T", " ")} UTC</div>}
        </div>
        <div className="h-px bg-border" />
        {sel ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="label-caps">Selected cell</div>
                <div className="font-mono text-sm">{fmt(sel.la, 1)}°, {fmt(sel.lo, 1)}° · 1°×1°</div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat k="Observations" v={fmtInt(sel.n)} />
              <Stat k="Mean FRP" v={`${fmt(sel.meanFrp)} MW`} />
              <Stat k="Max FRP" v={`${fmt(sel.maxFrp)} MW`} />
              <Stat k="Night detections" v={fmtInt(sel.night)} />
            </div>
            <div className="space-y-1">
              <div className="label-caps">By sensor</div>
              {SENSORS.filter((s) => sel.bySensor[s.id]).map((s) => {
                const b = sel.bySensor[s.id]!;
                return (
                  <div key={s.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 font-sans"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
                    <span>{b.n}</span><span className="text-fire">{fmt(b.meanFrp)}</span>
                    <span className="text-muted-foreground" title={s.id.startsWith("MODIS") ? "brightness (K)" : "bright_ti4 (K)"}>{fmt(b.brightness)}K</span>
                  </div>
                );
              })}
            </div>
            {region && (
              <div className="rounded-md bg-secondary p-3">
                <div className="label-caps">Region ±5° around cell</div>
                <div className="mt-1 text-sm">{fmtInt(region.n)} obs · {region.cells} cells · mean FRP {fmt(region.meanFrp)} MW</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Click a fire marker on the globe to see observation count, FRP and sensor breakdown for that grid cell and its region.</div>
        )}
      </div>

      {/* Bottom timeline */}
      <div className="panel absolute inset-x-4 bottom-4 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="label-caps">Daily fire activity · available observation dates (√ scale)</span>
          <span className="font-mono text-[10px] text-muted-foreground">Gap 2024-01-06 → 2025-12-29: No Data</span>
        </div>
        <div className="flex h-20 items-end gap-2">
          {AVAILABLE_DATES.map((d, i) => {
            const o = perDate[d] ?? {};
            const sum = Object.values(o).reduce((a, b) => a + (b ?? 0), 0);
            return (
              <div key={d} className="contents">
                {i === 5 && <div className="flex h-full w-16 items-center justify-center border-x border-dashed border-border font-mono text-[10px] text-muted-foreground">No Data</div>}
                <button onClick={() => setDate(d)} className={`group flex h-full flex-1 flex-col justify-end rounded px-1 ${d === date ? "bg-secondary" : "hover:bg-secondary/60"}`}>
                  <div className="flex w-full flex-col-reverse overflow-hidden rounded-sm" style={{ height: `${Math.sqrt(sum / maxDay) * 70}%` }}>
                    {SENSORS.map((s) => o[s.id] ? <div key={s.id} style={{ background: s.color, flexGrow: o[s.id] }} /> : null)}
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[10px]">
                    <span className={d === date ? "text-foreground" : "text-muted-foreground"}>{d.slice(5)}{d.startsWith("2025") ? " '25" : " '24"}</span>
                    <span className="text-muted-foreground">{sum ? fmtInt(sum) : "No Data"}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div><div className="label-caps">{k}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div>;
}
