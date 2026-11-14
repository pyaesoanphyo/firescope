import { Filter, LoaderCircle, Mountain, Trees, Waves, Globe2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { MAP_LAYERS, type LayerState, type LayerStatus, type LayerId } from "@/lib/map-layers";
const icons = { countries: Map, continents: Globe2, volcanoes: Mountain, oceans: Waves, forests: Trees };
export function LayerFilter({ layers, statuses, onChange }: { layers: LayerState; statuses: LayerStatus; onChange: (id: LayerId, value: boolean) => void }) {
  const count = Object.values(layers).filter(Boolean).length;
  return <Popover><PopoverTrigger asChild><Button variant="secondary" className="pointer-events-auto" aria-label="Geographic filters"><Filter />Filter{count > 0 && <span className="font-mono text-xs">{count}</span>}</Button></PopoverTrigger>
    <PopoverContent align="start" className="w-80 max-w-[calc(100vw-24px)] space-y-4">
      <div className="font-semibold">Geographic layers</div>
      {MAP_LAYERS.map(({ id, label, source }) => { const Icon = icons[id]; return <div key={id} className="flex items-start gap-3">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1"><label htmlFor={`layer-${id}`} className="cursor-pointer text-sm">{label}</label><div className="text-[11px] leading-relaxed text-muted-foreground">{source}</div>
          {layers[id] && statuses[id] === "loading" && <div role="status" className="flex items-center gap-1 text-xs text-muted-foreground"><LoaderCircle className="h-3 w-3 animate-spin" />Loading…</div>}
          {layers[id] && statuses[id] === "error" && <div role="alert" className="text-xs text-destructive">Unavailable <Button size="sm" variant="link" onClick={() => onChange(id, true)}>Retry</Button></div>}
        </div><Switch id={`layer-${id}`} checked={layers[id]} onCheckedChange={(value) => onChange(id, value)} />
      </div>; })}
    </PopoverContent>
  </Popover>;
}