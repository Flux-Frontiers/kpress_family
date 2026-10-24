// Schematic mode: the orchard drawn as a family diagram you can read while
// driving. Every person is a bead where the layout (familyTree.ts) puts them,
// its color the generation and its shape the recorded sex; the wood is
// straight barked limbs from parent to child, and a marriage is a brass bar
// between the spouses, the children's limbs leaving from its middle. The
// layout is the same as the organic trees', so switching modes moves no one.
//
// Pure, no React or three, so the tests can run it.

import { parentsOf, type FamilyIndex } from "./familyCatalog";
import { hourglassTree, lineTree, type FamilyTree } from "./familyTree";

export type BeadShape = "round" | "square" | "diamond";

export type SchematicBead = {
  id: string;
  /** Shown on the name plate; "" for a living person, who gets none. */
  name: string;
  x: number;
  y: number;
  z: number;
  /** Signed generations from the tree's trunk person: ancestors negative. */
  generation: number;
  shape: BeadShape;
  color: string;
  living: boolean;
  /** Index into the forest's trees, or -1 for the home tree. */
  tree: number;
};

export type SchematicSegment = { ax: number; ay: number; az: number; bx: number; by: number; bz: number };

export type Schematic = {
  beads: SchematicBead[];
  /** Parent to child, and each trunk from the ground to its first person. */
  limbs: SchematicSegment[];
  /** Spouse to spouse. */
  bars: SchematicSegment[];
};

/** A bead per generation, outward from the trunk person; ancestors count down the same ramp. */
export const GENERATION_COLORS = ["#e8c547", "#e9883a", "#d6534f", "#b54d8f", "#6f5bc0", "#3f83c9", "#2fa7a0", "#5aa84a"];
/** A living person's bead: no color, no name. */
export const LIVING_BEAD = "#9a9a9a";

/** The color of generation g; negative generations (ancestors) take the ramp from its far end. */
export function generationColor(g: number): string {
  const n = GENERATION_COLORS.length;
  return GENERATION_COLORS[((g % n) + n) % n]!;
}

function shapeOf(sex: string | null): BeadShape {
  return sex === "F" ? "round" : sex === "M" ? "square" : "diamond";
}

/**
 * One tree's beads, limbs and bars, placed at (ox, oz).
 *
 * A person's limb runs to them from the nearest person below them in the
 * wood (their parent in the canopy, their child in the roots), or from the
 * ground point for the trunk. When both of a child's parents are on the tree,
 * the limb leaves from the middle of the parents' bar instead.
 */
function addTree(index: FamilyIndex, t: FamilyTree, tree: number, ox: number, oz: number, out: Schematic): void {
  const byNode = new Map(t.people.map((p) => [p.node, p]));
  const at = new Map(t.people.map((p) => [p.id, { x: ox + p.x, y: p.y, z: oz + p.z }]));
  const below = (node: number) => {
    for (let i = t.skeleton.parents[node]!; i >= 0; i = t.skeleton.parents[i]!) {
      const p = byNode.get(i);
      if (p) return p;
    }
    return null;
  };
  const seg = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): SchematicSegment =>
    ({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z });
  for (const p of t.people) {
    const person = index.person.get(p.id);
    const here = at.get(p.id)!;
    const living = person?.living ?? false;
    out.beads.push({
      id: p.id,
      name: living ? "" : person?.name ?? p.id,
      ...here,
      generation: p.generation,
      shape: shapeOf(person?.sex ?? null),
      color: living ? LIVING_BEAD : generationColor(p.generation),
      living,
      tree,
    });
    const from = below(p.node);
    if (p.marriedIn) {
      if (from) out.bars.push(seg(at.get(from.id)!, here));
      continue;
    }
    if (!from) {
      out.limbs.push(seg({ x: ox, y: 0, z: oz }, here));
      continue;
    }
    // In the canopy, both parents on the tree: from the middle of their bar.
    const other = p.generation > from.generation
      ? parentsOf(index, p.id).find((q) => q !== from.id && at.has(q) && t.people.some((x) => x.id === q && x.marriedIn))
      : undefined;
    const start = at.get(from.id)!;
    if (other) {
      const o = at.get(other)!;
      out.limbs.push(seg({ x: (start.x + o.x) / 2, y: (start.y + o.y) / 2, z: (start.z + o.z) / 2 }, here));
    } else {
      out.limbs.push(seg(start, here));
    }
  }
}

/**
 * The whole orchard as a schematic: every line tree where the forest stands
 * it, and the home tree at the hub.
 *
 * :param trees: The forest's trees, in order: each line's slug and trunk position.
 * :param focal: The home tree's trunk person.
 */
export function buildSchematic(
  index: FamilyIndex,
  trees: readonly { line: { slug: string }; x: number; z: number }[],
  focal: string,
): Schematic {
  const out: Schematic = { beads: [], limbs: [], bars: [] };
  trees.forEach((t, i) => addTree(index, lineTree(index, t.line.slug), i, t.x, t.z, out));
  addTree(index, hourglassTree(index, focal), -1, 0, 0, out);
  return out;
}

/**
 * The bead a ray hits first, within `radius` of its center and `maxDist`
 * along the ray, or null.
 *
 * :param dir: Unit direction.
 */
export function pickBead(
  beads: readonly SchematicBead[],
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  radius: number,
  maxDist: number,
): SchematicBead | null {
  let best: SchematicBead | null = null, bestT = maxDist;
  for (const b of beads) {
    const ox = b.x - origin.x, oy = b.y - origin.y, oz = b.z - origin.z;
    const t = ox * dir.x + oy * dir.y + oz * dir.z;
    if (t < 0 || t > bestT) continue;
    const d2 = ox * ox + oy * oy + oz * oz - t * t;
    if (d2 <= radius * radius) { best = b; bestT = t; }
  }
  return best;
}
