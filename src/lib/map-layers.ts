export const MAP_LAYERS = [
  { id: "countries", label: "Countries", source: "Natural Earth · borders & names" },
  { id: "continents", label: "Continents", source: "Natural Earth · merged country outlines" },
  { id: "volcanoes", label: "Volcanoes", source: "Smithsonian GVP / NOAA · catalog locations" },
  { id: "oceans", label: "Oceans & seas", source: "Natural Earth · marine boundaries" },
  { id: "forests", label: "Forest biomes", source: "RESOLVE 2017 · not current tree cover" },
] as const;
export type LayerId = typeof MAP_LAYERS[number]["id"];
export type LayerState = Record<LayerId, boolean>;
export type LayerStatus = Partial<Record<LayerId, "loading" | "ready" | "error">>;
export const defaultLayers = (): LayerState => ({ countries: false, continents: false, volcanoes: false, oceans: false, forests: false });
export type MapFeature = { name: string; layer: LayerId; details: string; lon?: number; lat?: number };