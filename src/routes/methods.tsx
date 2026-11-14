import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fs/AppShell";

export const Route = createFileRoute("/methods")({
  head: () => ({ meta: [
    { title: "Data & Methods — FireScope" },
    { name: "description", content: "Dataset scope, gridding and data-integrity rules behind FireScope." },
    { property: "og:title", content: "Data & Methods — FireScope" },
    { property: "og:description", content: "Dataset scope, gridding and data-integrity rules behind FireScope." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => (
    <AppShell>
      <div className="h-full overflow-auto p-8">
        <div className="max-w-2xl space-y-6 text-sm leading-relaxed">
          <h1 className="text-2xl font-semibold">Data & Methods</h1>
          <Section t="Scope">156,810 active-fire observations from a unified pilot file. MODIS Aqua and Terra cover 2024-01-01 to 2024-01-05; VIIRS NOAA-20, NOAA-21 and S-NPP cover 2025-12-30. There is no continuous historical coverage; all other dates are shown as No Data.</Section>
          <Section t="Gridding">Detections are binned into 1°×1° cells per date and sensor. Marker size reflects observation count; color reflects observation-weighted mean Fire Radiative Power (MW).</Section>
          <Section t="Sensor-specific fields">MODIS brightness (K) and VIIRS bright_ti4 (K) are kept separate per sensor. Missing sensor-specific values stay empty (—) and are never replaced with zero.</Section>
          <Section t="Geographic sources">Countries, continent outlines, and marine regions: Natural Earth 1:110m, public domain. Continent outlines merge countries by Natural Earth continent classification; they are not tectonic boundaries. Volcano locations: Smithsonian GVP via NOAA NCEI's volcano catalog (1,389 locations); catalog status does not mean currently erupting. Forest biomes: 457 RESOLVE 2017 ecoregions in forest biomes 1–6, via UNEP-WCMC, simplified to 0.08°. These are ecological regions, not measured current forest cover. Geographic layers are independent of the pilot fire dates.<br /><a className="text-primary underline" href="https://www.naturalearthdata.com/">Natural Earth</a> · <a className="text-primary underline" href="https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/hazards/MapServer/7">NOAA / Smithsonian</a> · <a className="text-primary underline" href="https://data-gis.unep-wcmc.org/server/rest/services/Bio-geographicalRegions/Resolve_Ecoregions/FeatureServer/0">RESOLVE / UNEP-WCMC</a></Section>
          <Section t="Globe">Day imagery: Esri World Imagery. Night lights: NASA GIBS VIIRS Black Marble. Lighting and the day/night terminator follow the real Sun position at the current UTC time.</Section>
        </div>
      </div>
    </AppShell>
  ),
});

function Section({ t, children }: { t: string; children: React.ReactNode }) {
  return <section className="panel p-4"><div className="label-caps mb-1">{t}</div><p className="text-muted-foreground">{children}</p></section>;
}
