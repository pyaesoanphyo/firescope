import { describe, expect, it } from "vitest";
import { defaultLayers } from "./map-layers";
describe("geographic layer visibility", () => {
  it("keeps national borders and labels hidden until enabled", () => expect(defaultLayers().countries).toBe(false));
  it("keeps continent borders and labels hidden until enabled", () => expect(defaultLayers().continents).toBe(false));
});