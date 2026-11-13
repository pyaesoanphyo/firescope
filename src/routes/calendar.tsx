import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fs/AppShell";
import { fmtInt, loadCsv } from "@/lib/firescope";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [
    { title: "Fire Calendar — FireScope" },
    { name: "description", content: "Daily fire observation counts across the FireScope pilot dates." },
    { property: "og:title", content: "Fire Calendar — FireScope" },
    { property: "og:description", content: "Daily fire observation counts across the FireScope pilot dates." },
  ] }),
  component: CalendarPage,
});

function Month({ y, m, counts }: { y: number; m: number; counts: Record<string, number> }) {
  const first = new Date(Date.UTC(y, m, 1)); const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const max = Math.max(...Object.values(counts));
  return (
    <div className="panel p-4">
      <div className="mb-3 font-semibold">{first.toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" })}</div>
      <div className="grid grid-cols-7 gap-1.5">
        {"SMTWTFS".split("").map((d, i) => <div key={i} className="label-caps text-center">{d}</div>)}
        {Array.from({ length: first.getUTCDay() }).map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; const c = counts[key];
          return (
            <div key={key} className={`flex aspect-square flex-col items-center justify-center rounded text-xs ${c ? "text-primary-foreground" : "border border-dashed border-border text-muted-foreground"}`}
              style={c ? { background: `color-mix(in oklab, var(--fire) ${40 + (c / max) * 60}%, var(--amber))` } : undefined}>
              <span>{i + 1}</span>
              <span className="font-mono text-[9px]">{c ? fmtInt(c) : "No Data"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => { loadCsv("/data/calendar_daily_counts.csv").then((r) => setCounts(Object.fromEntries(r.map((x) => [x.acq_date, +x.fire_observations])))); }, []);
  return (
    <AppShell>
      <div className="h-full overflow-auto p-8">
        <h1 className="text-2xl font-semibold">Fire Calendar</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Only six dates contain observations in this pilot. Dashed days are <b>No Data</b> — not zero fire activity.</p>
        <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
          <Month y={2024} m={0} counts={counts} />
          <Month y={2025} m={11} counts={counts} />
        </div>
      </div>
    </AppShell>
  );
}
