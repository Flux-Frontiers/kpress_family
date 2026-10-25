// The home person's place on their own line's tree: the chain of wood from
// the ground up to them, which HomeMarks gilds, and where their lantern hangs.
// Pure, so the tests can run it.

import type { Skeleton } from "./growTree";
import type { FamilyTree } from "./familyTree";
import type { Schematic, SchematicSegment } from "./schematic";

/** The skeleton nodes from `node` down to the root, `node` first. */
export function descentNodes(skeleton: Skeleton, node: number): number[] {
  const out: number[] = [];
  for (let i = node; i >= 0; i = skeleton.parents[i]!) out.push(i);
  return out;
}

/** A segment of the gilded wood, with the sleeve's radius. */
export type GildedSegment = SchematicSegment & { r: number };

/**
 * The wood from the ground to `id` on a line tree standing at (ox, oz), as
 * segments a little thicker than the bark, so a sleeve over them gilds the
 * limbs. Null when `id` is not on the tree.
 */
export function gildedDescent(tree: FamilyTree, id: string, ox: number, oz: number): { segments: GildedSegment[]; at: { x: number; y: number; z: number } } | null {
  const person = tree.people.find((p) => p.id === id && !p.marriedIn);
  if (!person) return null;
  const { nodes, radii } = tree.skeleton;
  const pos = (i: number) => ({ x: ox + nodes[i * 3]!, y: nodes[i * 3 + 1]!, z: oz + nodes[i * 3 + 2]! });
  const chain = descentNodes(tree.skeleton, person.node);
  const segments: GildedSegment[] = [];
  for (let k = 0; k + 1 < chain.length; k++) {
    const a = pos(chain[k + 1]!), b = pos(chain[k]!);
    segments.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, r: radii[chain[k]!]! * 1.15 + 0.012 });
  }
  return { segments, at: pos(person.node) };
}

/**
 * The same descent in the schematic's straight limbs: the limb into each
 * person on the chain, and where a limb leaves from the middle of the
 * parents' bar, the half bar back to the parent on the chain. Radii to sleeve
 * the schematic's limbs (0.07 m) and trunk (0.16 m).
 */
export function gildedSchematic(schematic: Schematic, tree: FamilyTree, id: string, ox: number, oz: number): GildedSegment[] {
  const person = tree.people.find((p) => p.id === id && !p.marriedIn);
  if (!person) return [];
  const byNode = new Map(tree.people.map((p) => [p.node, p]));
  const at = (p: { x: number; y: number; z: number }) => ({ x: ox + p.x, y: p.y, z: oz + p.z });
  const near = (a: { x: number; y: number; z: number }, x: number, y: number, z: number) => Math.hypot(a.x - x, a.y - y, a.z - z) < 1e-6;
  const chain = descentNodes(tree.skeleton, person.node).map((n) => byNode.get(n)).filter((p) => p && !p.marriedIn) as typeof tree.people;
  const out: GildedSegment[] = [];
  chain.forEach((p, k) => {
    const here = at(p);
    const limb = schematic.limbs.find((s) => near(here, s.bx, s.by, s.bz));
    if (!limb) return;
    out.push({ ...limb, r: limb.ay === 0 ? 0.19 : 0.09 });
    const parent = chain[k + 1];
    if (parent) {
      const from = at(parent);
      if (!near(from, limb.ax, limb.ay, limb.az)) out.push({ ax: from.x, ay: from.y, az: from.z, bx: limb.ax, by: limb.ay, bz: limb.az, r: 0.07 });
    }
  });
  return out;
}
