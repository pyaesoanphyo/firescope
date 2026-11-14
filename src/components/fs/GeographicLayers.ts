import type { LayerId, LayerState, LayerStatus, MapFeature } from "@/lib/map-layers";
// Cesium is loaded only in the browser by Globe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;
export function geographicLayers(viewer: C, Cesium: C, element: HTMLElement, status: (id: LayerId, value: LayerStatus[LayerId]) => void) {
  let disposed = false;
  let visibility: LayerState;
  const loaded = new Map<LayerId, { show: (value: boolean) => void }>();
  const pending = new Set<LayerId>();
  const theme = getComputedStyle(element);
  const color = (token: string) => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return Cesium.Color.WHITE;
    ctx.fillStyle = theme.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
    const [r = 255, g = 255, b = 255] = ctx.getImageData(0, 0, 1, 1).data;
    return new Cesium.Color(r / 255, g / 255, b / 255);
  };
  const labelColor = color("--country-label"), outline = color("--country-label-outline");
  async function load(id: LayerId) {
    pending.add(id); status(id, "loading");
    try {
      const response = await fetch(`/data/${id}.geojson`);
      if (!response.ok) throw new Error("Map unavailable");
      const data = await response.json();
      if (disposed) return;
      const tint = color(id === "forests" ? "--forest-map" : id === "oceans" ? "--ocean-map" : id === "volcanoes" ? "--volcano-map" : id === "continents" ? "--continent-map" : "--country-border");
      const labels = viewer.scene.primitives.add(new Cesium.LabelCollection());
      const lines = viewer.scene.primitives.add(new Cesium.PolylineCollection());
      const dots = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      let fill: C;
      if (id === "forests" || id === "oceans") {
        fill = await Cesium.GeoJsonDataSource.load(data, { stroke: tint.withAlpha(0.65), strokeWidth: 1, fill: tint.withAlpha(id === "forests" ? 0.22 : 0.08) });
        if (disposed) return;
        // Context polygons must not intercept fire picking.
        for (const entity of fill.entities.values) { entity.name = undefined; if (entity.polygon) entity.polygon.height = 0; }
        await viewer.dataSources.add(fill);
      }
      for (const feature of data.features) {
        const p = feature.properties;
        const name = p.NAME_EN ?? p.name ?? p.eco_name;
        const lon = id === "volcanoes" ? feature.geometry.coordinates[0] : p.LABEL_X ?? p.lon;
        const lat = id === "volcanoes" ? feature.geometry.coordinates[1] : p.LABEL_Y ?? p.lat;
        const info: MapFeature = { name, layer: id, lon, lat, details: id === "volcanoes" ? `${p.country} · ${p.type ?? "Unknown type"} · ${p.elevation ?? "—"} m · catalog status: ${p.status ?? "Unknown"}` : id === "forests" ? p.biome_name : id === "continents" ? "Natural Earth continent outline" : "Natural Earth marine region" };
        if (id === "countries" || id === "continents") {
          const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
          for (const polygon of polygons) for (const ring of polygon) lines.add({ positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()), width: id === "continents" ? 2 : 1.2, material: Cesium.Material.fromType("Color", { color: tint.withAlpha(0.75) }) });
        }
        if (id === "volcanoes") dots.add({ id: { mapFeature: info }, position: Cesium.Cartesian3.fromDegrees(lon, lat, 500), pixelSize: 7, color: tint, outlineColor: outline, outlineWidth: 1.5 });
        if (lon != null && lat != null) labels.add({
          id: id === "countries" ? undefined : { mapFeature: info },
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 1000), text: name,
          font: `${id === "continents" ? 16 : 12}px 'Space Grotesk', sans-serif`, fillColor: id === "countries" ? labelColor : tint, outlineColor: outline, outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE, horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          pixelOffset: id === "volcanoes" ? new Cesium.Cartesian2(0, -14) : Cesium.Cartesian2.ZERO,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, id === "volcanoes" ? 1.5e6 : id === "countries" && p.LABELRANK > 3 ? (p.LABELRANK <= 5 ? 1.2e7 : 5e6) : 5e7),
          scaleByDistance: new Cesium.NearFarScalar(1e6, 1, 3e7, 0.8),
        });
      }
      loaded.set(id, { show: (value) => { labels.show = value; lines.show = value; dots.show = value; if (fill) fill.show = value; element.setAttribute(`data-layer-${id}`, String(value)); } });
      loaded.get(id)?.show(visibility[id]); status(id, "ready");
    } catch { if (!disposed) status(id, "error"); }
    finally { pending.delete(id); }
  }
  return {
    update(next: LayerState) { visibility = next; for (const id of Object.keys(next) as LayerId[]) { loaded.get(id)?.show(next[id]); if (next[id] && !loaded.has(id) && !pending.has(id)) void load(id); } },
    dispose() { disposed = true; },
  };
}