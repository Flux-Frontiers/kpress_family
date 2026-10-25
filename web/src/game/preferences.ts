export type Preferences = {
  pace: "gentle" | "brisk";
  sensitivity: number;
  /** "god" looks down on the whole forest from above the hub. */
  camera: "follow" | "high" | "cart" | "god";
  motion: boolean;
  detail: boolean;
  /** Show triangles, draw calls, leaves and frame rate. */
  stats: boolean;
  /** Silent mode: no cards pop up on their own (nearby book, redwood, quest hints). */
  silent: boolean;
  /** Fog density; see FOG_SCALE. */
  fog: FogLevel;
  /** Random weather: morning fogs that burn off, up to pea soup, and drifting cloud (weather.ts). */
  weather: boolean;
  /** Riding the ring, read each grove's summary aloud at its stop. */
  narrate: boolean;
  /** Draw every tree as a family diagram: beads, straight limbs, marriage bars (schematic.ts). */
  schematic: boolean;
  /** Name plates over the people of the tree nearest the cart (NamePlates.tsx). */
  names: boolean;
};


export type FogLevel = "clear" | "light" | "normal" | "heavy";

/** Multiplier on the season's fog density (World.tsx). */
export const FOG_SCALE: Record<FogLevel, number> = { clear: 0.3, light: 0.6, normal: 1, heavy: 1.8 };

export function readPreferences(value?: Partial<Preferences>): Preferences {
  return {
    pace: value?.pace === "brisk" ? "brisk" : "gentle",
    sensitivity: typeof value?.sensitivity === "number" && Number.isFinite(value.sensitivity)
      ? Math.max(0.5, Math.min(1.5, value.sensitivity)) : 1,
    // New visitors start in the high view, which shows a tree with the cart before it.
    camera: value?.camera === "follow" || value?.camera === "cart" || value?.camera === "god" ? value.camera : "high",
    motion: typeof value?.motion === "boolean" ? value.motion
      : !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches),
    detail: typeof value?.detail === "boolean" ? value.detail : true,
    stats: value?.stats === true,
    silent: value?.silent === true,
    fog: value?.fog && value.fog in FOG_SCALE ? value.fog : "normal",
    weather: value?.weather === true,
    narrate: value?.narrate === true,
    schematic: value?.schematic === true,
    names: typeof value?.names === "boolean" ? value.names : true,
  };
}
