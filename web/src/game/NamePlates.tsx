import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { CanvasTexture, SpriteMaterial, SRGBColorSpace } from "three";
import type { Forest } from "./forest";
import type { Schematic } from "./schematic";
import { sim } from "./sim";
import { useGame } from "./store";

/** Name plates show over the people of the tree nearest the cart, within this far, m. */
const LABEL_REACH = 30;
/** A name plate's height as a fraction of the view's: one size on screen at any distance, as GroveLabels does. */
const LABEL_SCREEN = 0.024;
const LABEL_PX = 64;
/** A plate hangs this far above a person's node, m, or below for a married-in spouse. */
const PLATE_LIFT = 0.94;

/** A name on a dark rounded plate, as a sprite material; cached by name. */
const plates = new Map<string, { material: SpriteMaterial; aspect: number }>();
function plate(name: string) {
  const hit = plates.get(name);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = `600 ${LABEL_PX * 0.56}px "Source Sans 3", ui-sans-serif, system-ui, sans-serif`;
  let width = LABEL_PX * 3;
  if (ctx) { ctx.font = font; width = Math.ceil(ctx.measureText(name).width + LABEL_PX * 0.6); }
  canvas.width = width;
  canvas.height = LABEL_PX;
  if (ctx) {
    ctx.font = font;
    ctx.fillStyle = "rgba(22, 33, 62, 0.8)";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, LABEL_PX, LABEL_PX / 2);
    ctx.fill();
    ctx.fillStyle = "#f3ead8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, width / 2, LABEL_PX / 2 + 1);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const made = { material: new SpriteMaterial({ map, sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true, fog: false }), aspect: width / LABEL_PX };
  plates.set(name, made);
  return made;
}

/**
 * Name plates over the people of the tree nearest the cart, in the wood view
 * and the schematic alike: the schematic's beads give every person's place
 * on their tree, and the wooden trees are grown from the same layout. Not in
 * god's eye, where the grove names (GroveLabels) say enough, and off by the
 * "Name plates" setting (N).
 */
export function NamePlates({ forest, schematic }: { forest: Forest; schematic: Schematic }) {
  // The tree whose names show: the nearest to the cart, checked twice a second.
  const [named, setNamed] = useState<number | null>(null);
  const since = useRef(0);
  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < 0.5) return;
    since.current = 0;
    let best: number | null = null, bestD = LABEL_REACH;
    const home = Math.hypot(sim.x, sim.z);
    if (home < bestD) { best = -1; bestD = home; }
    forest.trees.forEach((t, i) => {
      const d = Math.hypot(t.x - sim.x, t.z - sim.z);
      if (d < bestD) { best = i; bestD = d; }
    });
    if (best !== named) setNamed(best);
  });
  const godEye = useGame((s) => s.preferences.camera === "god");
  const names = useGame((s) => s.preferences.names);
  // Only while driving: on the start screen the plates drew over its card.
  const playing = useGame((s) => s.playing);
  const labels = useMemo(
    () => (named === null || godEye || !names || !playing ? [] : schematic.beads.filter((b) => b.tree === named && b.name)),
    [named, schematic, godEye, names, playing],
  );

  return (
    <group>
      {labels.map((b) => {
        const p = plate(b.name);
        return (
          // A spouse's plate hangs below their node, their partner's above, so a couple's names do not collide.
          <sprite key={b.id + b.tree} material={p.material} position={[b.x, b.y + (b.marriedIn ? -PLATE_LIFT : PLATE_LIFT), b.z]}
            scale={[LABEL_SCREEN * p.aspect, LABEL_SCREEN, 1]} renderOrder={10} />
        );
      })}
    </group>
  );
}
