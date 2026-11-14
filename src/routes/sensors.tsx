import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fs/AppShell";
import { SENSORS, fmt, fmtInt, loadCsv } from "@/lib/firescope";

export const Route = createFileRoute("/sensors")({
  head: () => ({ meta: [
    { title: "Sensor Analysis — FireScope" },
    { name: "description", content: "Fire radiative power statistics for MODIS and VIIRS sensors." },
    { property: "og:title", content: "Sensor Analysis — FireScope" },
    { property: "og:description", content: "Fire radiative power statistics for MODIS and VIIRS sensors." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SensorsPage,
});

function SensorsPage() {
  const [rows, setRows] = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useState<any[]>([]);
  useEffect(() => { loadCsv("/data/frp_summary_by_sensor.csv").then(setRows); }, []);
  const maxMean = Math.max(1, ...rows.map((r) => +r.mean_frp));
  return (
    <AppShell>
      <div className="h-full overflow-auto p-8">
        <h1 className="text-2xl font-semibold">Sensor Analysis</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">FRP per sensor, as reported. MODIS (1 km) and VIIRS (375 m) pixels differ in size, so per-detection FRP is not directly comparable across instruments.</p>
        <div className="mt-6 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SENSORS.map((s) => {
            const r = rows.find((x) => x.source_product === s.id); if (!r) return null;
            return (
              <div key={s.id} className="panel space-y-3 p-4">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /><span className="font-semibold">{s.label}</span><span className="ml-auto font-mono text-[10px] text-muted-foreground">{s.instrument}</span></div>
                <div className="text-3xl font-semibold tabular-nums">{fmtInt(+r.observation_count)}<span className="ml-1 text-sm font-normal text-muted-foreground">obs</span></div>
                <div className="h-1.5 rounded-full bg-secondary"><div className="bg-fire-gradient h-full rounded-full" style={{ width: `${(+r.mean_frp / maxMean) * 100}%` }} /></div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">Mean FRP</span><span>{fmt(+r.mean_frp, 2)} MW</span>
                  <span className="text-muted-foreground">Median FRP</span><span>{fmt(+r.median_frp, 2)} MW</span>
                  <span className="text-muted-foreground">Max FRP</span><span>{fmt(+r.max_frp, 1)} MW</span>
                  <span className="text-muted-foreground">Total FRP</span><span>{fmtInt(Math.round(+r.total_frp))} MW</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
