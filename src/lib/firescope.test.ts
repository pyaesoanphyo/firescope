import { describe, it, expect } from "vitest";
import { aggregate, hasData, type RawCell } from "./firescope";

const rows: RawCell[] = [
  { d: "2024-01-01", s: "MODIS_AQUA", la: 1.5, lo: 2.5, n: 2, f: 10, mx: 12, b: 320, nn: 0 },
  { d: "2024-01-01", s: "VIIRS_SNPP", la: 1.5, lo: 2.5, n: 2, f: 20, mx: 25, b: null, nn: 1 },
];
describe("firescope", () => {
  it("weights mean FRP by observations", () => expect(aggregate(rows, "all", ["MODIS_AQUA", "VIIRS_SNPP"])[0].meanFrp).toBe(15));
  it("keeps missing sensor brightness null, not zero", () => expect(aggregate(rows, "all", ["VIIRS_SNPP"])[0].bySensor.VIIRS_SNPP?.brightness).toBeNull());
  it("dates outside the pilot are No Data", () => { expect(hasData("2024-06-01")).toBe(false); expect(hasData("2025-12-30")).toBe(true); });
});
