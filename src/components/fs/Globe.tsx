import { useEffect, useRef, useState } from "react";
import type { Cell } from "@/lib/firescope";

const CESIUM = "https://cdn.jsdelivr.net/npm/cesium@1.123.0/Build/Cesium/";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;
let loader: Promise<C> | null = null;
function loadCesium(): Promise<C> {
  const w = window as C;
  if (w.Cesium) return Promise.resolve(w.Cesium);
  if (!loader) loader = new Promise((res, rej) => {
    w.CESIUM_BASE_URL = CESIUM;
    const s = document.createElement("script");
    s.src = CESIUM + "Cesium.js"; s.onload = () => res(w.Cesium); s.onerror = rej;
    document.head.appendChild(s);
  });
  return loader;
}

export type GlobeApi = { flyTo: (lon: number, lat: number, height?: number) => void };

/** FRP → color ramp amber → orange → red → white-hot. */
function frpColor(Cesium: C, frp: number | null) {
  if (frp == null) return Cesium.Color.fromCssColorString("#8a93a6");
  const t = Math.min(1, Math.log10(1 + frp) / Math.log10(1 + 200));
  const stops = ["#ffd36b", "#ff9a2e", "#ff5a1f", "#ff2d2d", "#fff1d6"];
  const i = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const f = t * (stops.length - 1) - i;
  return Cesium.Color.lerp(Cesium.Color.fromCssColorString(stops[i]), Cesium.Color.fromCssColorString(stops[i + 1]), f, new Cesium.Color());
}

export function Globe({ cells, selected, onSelect, onReady, onTime }: {
  cells: Cell[]; selected: string | null; onSelect: (key: string | null) => void;
  onReady?: (api: GlobeApi) => void; onTime?: (d: Date) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const v = useRef<{ viewer: C; Cesium: C; points: C } | null>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ onSelect, onTime }); cb.current = { onSelect, onTime };

  useEffect(() => {
    let destroyed = false;
    loadCesium().then((Cesium) => {
      if (destroyed || !el.current) return;
      const viewer = new Cesium.Viewer(el.current, {
        baseLayer: false, animation: false, timeline: false, geocoder: false, homeButton: false,
        sceneModePicker: false, baseLayerPicker: false, navigationHelpButton: false, fullscreenButton: false,
        infoBox: false, selectionIndicator: false, shouldAnimate: true,
      });
      const day = new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maximumLevel: 18, credit: "Esri, Maxar, Earthstar Geographics",
      }));
      day.nightAlpha = 0.0;
      const night = new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
        maximumLevel: 8, credit: "NASA GIBS Black Marble",
      }));
      night.dayAlpha = 0.0; night.brightness = 1.6;
      viewer.imageryLayers.add(day); viewer.imageryLayers.add(night);
      const g = viewer.scene.globe;
      g.enableLighting = true; g.dynamicAtmosphereLighting = true; g.dynamicAtmosphereLightingFromSun = true;
      g.showGroundAtmosphere = true; g.baseColor = Cesium.Color.fromCssColorString("#0b1226");
      viewer.scene.skyAtmosphere.show = true;
      viewer.clock.currentTime = Cesium.JulianDate.now();
      viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(20, 5, 2.2e7) });
      const points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      const h = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      h.setInputAction((e: C) => {
        const p = viewer.scene.pick(e.position);
        cb.current.onSelect(p && typeof p.id === "string" ? p.id : null);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      let last = 0;
      viewer.clock.onTick.addEventListener((clk: C) => {
        const now = Date.now(); if (now - last < 1000) return; last = now;
        cb.current.onTime?.(Cesium.JulianDate.toDate(clk.currentTime));
      });
      v.current = { viewer, Cesium, points };
      onReady?.({ flyTo: (lon, lat, height = 3e6) => viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, height), duration: 1.8 }) });
      setReady(true);
      el.current.setAttribute("data-scene-ready", "true");
    });
    return () => { destroyed = true; v.current?.viewer.destroy(); v.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = v.current; if (!s) return;
    const { Cesium, points } = s;
    points.removeAll();
    for (const c of cells) {
      const isSel = c.key === selected;
      points.add({
        id: c.key,
        position: Cesium.Cartesian3.fromDegrees(c.lo, c.la, 2000),
        pixelSize: 3 + Math.min(14, Math.sqrt(c.n) * 1.4) + (isSel ? 4 : 0),
        color: frpColor(Cesium, c.meanFrp).withAlpha(0.88),
        outlineColor: isSel ? Cesium.Color.WHITE : Cesium.Color.BLACK.withAlpha(0.35),
        outlineWidth: isSel ? 2.5 : 0.5,
        scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.6, 2.5e7, 0.7),
      });
    }
  }, [cells, selected, ready]);

  return <div ref={el} className="absolute inset-0" />;
}
