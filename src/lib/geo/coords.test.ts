import { describe, expect, it } from "vitest";
import { parseCoords } from "./coords";

describe("parseCoords", () => {
  it("formats décimaux", () => {
    expect(parseCoords("49.880454, 2.238535")).toEqual({ lat: 49.880454, lon: 2.238535 });
    expect(parseCoords("49,880454 2,238535")).toEqual({ lat: 49.880454, lon: 2.238535 });
    expect(parseCoords("49.88;2.23")).toEqual({ lat: 49.88, lon: 2.23 });
  });
  it("ordre inversé lon, lat toléré", () => {
    expect(parseCoords("2.238535, 49.880454")).toEqual({ lat: 49.880454, lon: 2.238535 });
  });
  it("degrés minutes secondes", () => {
    const r = parseCoords(`49°52'49.6"N 2°14'18.7"E`)!;
    expect(r.lat).toBeCloseTo(49.8804, 3);
    expect(r.lon).toBeCloseTo(2.2385, 3);
  });
  it("DROM et longitude ouest", () => {
    expect(parseCoords("-21.1151, 55.5364")).toEqual({ lat: -21.1151, lon: 55.5364 });
  });
  it("rejette les saisies invalides ou hors France", () => {
    expect(parseCoords("bonjour")).toBeNull();
    expect(parseCoords("40.7128, -74.0060")).toBeNull();
    expect(parseCoords("49.88")).toBeNull();
  });
});
