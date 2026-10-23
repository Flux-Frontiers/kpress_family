// Family trees whose wood is the kinship graph: a child's limb branches from
// its parent and a parent's root from its child. This is a layout, not growth
// -- space colonization grows wood toward whatever is nearest, which draws a
// tree with the family's leaf count but not the family. A port of
// genealogy_kg.hourglass (Z-up there, Y-up here), with one addition: the line
// tree, a surname line's descent from its founder.
//
// Two shapes:
//
// * The home tree (`hourglassTree`): the focal person and spouse(s) are the
//   trunk at ground level; ancestors are the roots below (a fan chart, each
//   wedge halved between two parents), descendants the canopy above (a radial
//   tidy tree, wedges split by descendant weight).
// * A line tree (`lineTree`): the founder is the trunk top; the canopy is
//   everyone born into the line. A child whose line is another (a daughter's
//   children take their father's surname) is not drawn: they grow on their
//   own line's tree. A spouse who married in hangs as a short twig at the
//   fork, flagged `marriedIn`, and is a member of their own line's tree.
//
// Pedigree collapse (an ancestor reachable by two paths) places the person
// once and counts the second edge in `skipped`.

import type { FamilyIndex } from "./familyCatalog";
import { childrenOf, parentsOf } from "./familyCatalog";
import { pipeRadii, type Skeleton } from "./growTree";
import { mulberry32, seedFromKey } from "./math";

/** Trunk, from the ground to the first fork. */
export const TRUNK_HEIGHT = 3.0;
/** Rise per descendant generation. */
export const TIER_UP = 2.0;
/** Drop per ancestor generation; roots are shallower than the canopy is tall. */
export const TIER_DOWN = 1.5;
/** Radial reach per generation before the crowding floor. */
const RING = 2.0;
/** Least arc between two people on one ring; a crowded tier widens. */
const MIN_LEAF_ARC = 0.9;
/** How far a married-in spouse's twig reaches from the fork. */
const SPOUSE_REACH = 0.55;
/** Curve points inserted per kinship edge. */
export const EDGE_SUBDIVISIONS = 3;
/** Sideways jitter on those points, as a fraction of the edge. */
const EDGE_JITTER = 0.08;
const SIZE_REFERENCE_POPULATION = 200;
const MIN_SIZE_SCALE = 0.6;
const MAX_SIZE_SCALE = 2.0;
/** kg_utils.viz3d.organic.PIPE_EXPONENT */
const PIPE_EXPONENT = 2.2;
const TIP_RADIUS = 0.03;

export const DEFAULT_MAX_ANCESTORS = 5;
export const DEFAULT_MAX_DESCENDANTS = 4;

export type TreePerson = {
  id: string;
  /** This person's node in the skeleton. */
  node: number;
  /** Signed generations from the trunk person: ancestors negative. */
  generation: number;
  /** Drawn here as a spouse; a member of another tree (or the home tree's partner). */
  marriedIn: boolean;
  x: number;
  y: number;
  z: number;
};

export type FamilyTree = {
  /** Curved wood with pipe-model radii, ready for emitBark. Node 0 is the ground point. */
  skeleton: Skeleton;
  people: TreePerson[];
  trunkHeight: number;
  scale: number;
  /** Kinship edges not drawn because their target was already placed. */
  skipped: number;
};

type P3 = [number, number, number];

class Builder {
  points: P3[] = [];
  parents: number[] = [];
  person: (string | null)[] = [];
  people: TreePerson[] = [];
  placed = new Set<string>();
  skipped = 0;

  add(p: P3, parent: number, id: string | null, generation = 0, marriedIn = false): number {
    const node = this.points.length;
    this.points.push(p);
    this.parents.push(parent);
    this.person.push(id);
    if (id !== null) {
      this.placed.add(id);
      this.people.push({ id, node, generation, marriedIn, x: p[0], y: p[1], z: p[2] });
    }
    return node;
  }
}

const polar = (r: number, a: number, y: number): P3 => [r * Math.cos(a), y, r * Math.sin(a)];

function sizeScale(population: number): number {
  const raw = Math.sqrt(SIZE_REFERENCE_POPULATION / Math.max(population, 1));
  return Math.min(Math.max(raw, MIN_SIZE_SCALE), MAX_SIZE_SCALE);
}

function ringRadius(tier: number, count: number, scale: number): number {
  return Math.max(tier * RING * scale, (count * MIN_LEAF_ARC * scale) / (2 * Math.PI));
}

/** Which children a canopy walk follows. */
type ChildFilter = (child: string) => boolean;

/** People drawn in `id`'s descent within `depth` generations, counting themselves. */
function descendantWeight(
  index: FamilyIndex, id: string, depth: number, keep: ChildFilter, seen: Set<string>, cache: Map<string, number>,
): number {
  const key = `${id}|${depth}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (seen.has(id)) return 1;
  seen.add(id);
  let total = 1;
  for (const f of index.familiesOf.get(id) ?? []) {
    total += 1; // the spouse's twig
    if (depth >= 1) for (const c of childrenOf(index, f)) if (keep(c)) total += descendantWeight(index, c, depth - 1, keep, seen, cache);
  }
  seen.delete(id);
  cache.set(key, total);
  return total;
}

function canopyCounts(index: FamilyIndex, root: string, maxGen: number, keep: ChildFilter): Map<number, number> {
  const counts = new Map<number, number>();
  const bump = (g: number) => counts.set(g, (counts.get(g) ?? 0) + 1);
  const seen = new Set([root]);
  const queue: [string, number][] = [[root, 0]];
  while (queue.length) {
    const [id, gen] = queue.shift()!;
    bump(gen);
    for (const f of index.familiesOf.get(id) ?? []) {
      for (const s of index.family.get(f)!.spouses) if (!seen.has(s)) { seen.add(s); bump(gen); }
      if (gen + 1 > maxGen) continue;
      for (const c of childrenOf(index, f)) if (keep(c) && !seen.has(c)) { seen.add(c); queue.push([c, gen + 1]); }
    }
  }
  return counts;
}

function rootCounts(index: FamilyIndex, root: string, maxGen: number): Map<number, number> {
  const counts = new Map<number, number>();
  const seen = new Set([root]);
  const queue: [string, number][] = [[root, 0]];
  while (queue.length) {
    const [id, gen] = queue.shift()!;
    if (gen + 1 > maxGen) continue;
    for (const p of parentsOf(index, id)) {
      if (seen.has(p)) continue;
      seen.add(p);
      counts.set(gen + 1, (counts.get(gen + 1) ?? 0) + 1);
      queue.push([p, gen + 1]);
    }
  }
  return counts;
}

type Frame = { scale: number; trunkHeight: number; tierUp: number; tierDown: number };

function frame(population: number): Frame {
  const scale = sizeScale(population);
  return { scale, trunkHeight: TRUNK_HEIGHT * scale, tierUp: TIER_UP * scale, tierDown: TIER_DOWN * scale };
}

/** The canopy above `node`: a radial tidy tree, wedges by descendant weight. */
function placeCanopy(
  index: FamilyIndex, b: Builder, f: Frame, counts: Map<number, number>, maxGen: number, keep: ChildFilter,
  id: string, node: number, gen: number, start: number, span: number, weights: Map<string, number>,
): void {
  const families = index.familiesOf.get(id) ?? [];
  if (!families.length) return;
  const below = maxGen - gen - 1;
  const famWeights = families.map((fam) => {
    let w = 1;
    if (below >= 0) for (const c of childrenOf(index, fam)) if (keep(c)) w += descendantWeight(index, c, below, keep, new Set(), weights);
    return w;
  });
  const total = famWeights.reduce((a, w) => a + w, 0);
  const here = b.points[node]!;
  let cursor = start;
  families.forEach((fam, k) => {
    const famSpan = (span * famWeights[k]!) / total;
    const mid = cursor + famSpan / 2;
    for (const s of index.family.get(fam)!.spouses) {
      if (s === id) continue;
      if (b.placed.has(s)) { b.skipped++; continue; }
      const t = polar(SPOUSE_REACH * f.scale, mid, 0.25 * f.scale);
      b.add([here[0] + t[0], here[1] + t[1], here[2] + t[2]], node, s, gen, true);
    }
    if (below >= 0) {
      const kids = childrenOf(index, fam).filter(keep);
      const kidWeights = kids.map((c) => descendantWeight(index, c, below, keep, new Set(), weights));
      const kidTotal = kidWeights.reduce((a, w) => a + w, 0) || 1;
      const radius = ringRadius(gen + 1, counts.get(gen + 1) ?? 1, f.scale);
      const y = f.trunkHeight + (gen + 1) * f.tierUp;
      let c0 = cursor;
      kids.forEach((c, j) => {
        const kidSpan = (famSpan * kidWeights[j]!) / kidTotal;
        const angle = c0 + kidSpan / 2;
        c0 += kidSpan;
        if (b.placed.has(c)) { b.skipped++; return; }
        const n = b.add(polar(radius, angle, y), node, c, gen + 1);
        placeCanopy(index, b, f, counts, maxGen, keep, c, n, gen + 1, angle - kidSpan / 2, kidSpan, weights);
      });
    }
    cursor += famSpan;
  });
}

/** The roots below ground: a fan chart, each wedge halved between the parents. */
function placeRoots(
  index: FamilyIndex, b: Builder, f: Frame, counts: Map<number, number>, maxGen: number,
  id: string, node: number, depth: number, start: number, span: number,
): void {
  if (depth + 1 > maxGen) return;
  const parents = parentsOf(index, id);
  if (!parents.length) return;
  const radius = ringRadius(depth + 1, counts.get(depth + 1) ?? 1, f.scale);
  const y = -(depth + 1) * f.tierDown;
  const part = span / parents.length;
  parents.forEach((p, i) => {
    if (b.placed.has(p)) { b.skipped++; return; }
    const n = b.add(polar(radius, start + part * (i + 0.5), y), node, p, -(depth + 1));
    placeRoots(index, b, f, counts, maxGen, p, n, depth + 1, start + part * i, part);
  });
}

/** Standard normal from a uniform source (Box-Muller). */
function normal(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/**
 * Curve every kinship edge and size the wood by the pipe model.
 *
 * Each edge becomes a quadratic whose control point sits above (canopy) or
 * below (roots) the parent at the child's height, so a limb leaves along the
 * trunk's direction and then reaches out. Parent-before-child order is kept.
 */
function finish(b: Builder, key: string, f: Frame): FamilyTree {
  const rng = mulberry32(seedFromKey(`${key}:wood`));
  const pts: number[] = [];
  const parents: number[] = [];
  const map: number[] = [];
  for (let i = 0; i < b.points.length; i++) {
    const p = b.parents[i]!;
    const end = b.points[i]!;
    if (p < 0) {
      map[i] = parents.length;
      pts.push(...end);
      parents.push(-1);
      continue;
    }
    const start = b.points[p]!;
    const ctrl: P3 = [start[0], end[1], start[2]];
    const d: P3 = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    const length = Math.hypot(...d);
    // Sideways: delta x up, normalised; zero for a vertical edge.
    let sx = -d[2], sz = d[0];
    const sl = Math.hypot(sx, sz);
    if (sl > 1e-9) { sx /= sl; sz /= sl; } else { sx = 0; sz = 0; }
    let last = map[p]!;
    for (let k = 1; k <= EDGE_SUBDIVISIONS; k++) {
      const t = k / (EDGE_SUBDIVISIONS + 1);
      const a = (1 - t) ** 2, c = 2 * (1 - t) * t, e = t * t;
      const off = normal(rng) * EDGE_JITTER * length * Math.sin(Math.PI * t);
      pts.push(
        a * start[0] + c * ctrl[0] + e * end[0] + sx * off,
        a * start[1] + c * ctrl[1] + e * end[1],
        a * start[2] + c * ctrl[2] + e * end[2] + sz * off,
      );
      parents.push(last);
      last = parents.length - 1;
    }
    map[i] = parents.length;
    pts.push(...end);
    parents.push(last);
  }
  const n = parents.length;
  const parentArr = Int32Array.from(parents);
  const skeleton: Skeleton = {
    nodes: Float32Array.from(pts),
    parents: parentArr,
    radii: pipeRadii(parentArr, n, TIP_RADIUS * f.scale, PIPE_EXPONENT, f.trunkHeight),
    n,
  };
  const people = b.people.map((p) => ({ ...p, node: map[p.node]! }));
  return { skeleton, people, trunkHeight: f.trunkHeight, scale: f.scale, skipped: b.skipped };
}

/**
 * The person whose home tree is the fullest hourglass: the most people in the
 * smaller of its two halves (ancestors, and descendants with their spouses),
 * within the default caps, the larger total breaking a tie. Counting the total
 * alone picks a prolific founder with nothing below ground, and a line's
 * founder is a poor default for the same reason.
 */
export function richestFocal(index: FamilyIndex): string {
  let best = "", bestBalance = -1, bestTotal = -1;
  const all: ChildFilter = () => true;
  for (const id of [...index.person.keys()].sort()) {
    if (index.person.get(id)!.living) continue;
    let roots = 0, canopy = 0;
    for (const v of rootCounts(index, id, DEFAULT_MAX_ANCESTORS).values()) roots += v;
    // The canopy count includes the person themself.
    for (const v of canopyCounts(index, id, DEFAULT_MAX_DESCENDANTS, all).values()) canopy += v;
    const balance = Math.min(roots, canopy - 1), total = roots + canopy;
    if (balance > bestBalance || (balance === bestBalance && total > bestTotal)) {
      best = id; bestBalance = balance; bestTotal = total;
    }
  }
  return best;
}

/**
 * The home tree: the focal person's ancestors as roots, descendants as canopy.
 *
 * :param focal: The trunk person's id.
 * :param opts.maxAncestors: Generations below ground; Infinity for all.
 * :param opts.maxDescendants: Generations above the trunk; Infinity for all.
 * :throws: For an unknown person.
 */
export function hourglassTree(
  index: FamilyIndex,
  focal: string,
  opts: { maxAncestors?: number; maxDescendants?: number } = {},
): FamilyTree {
  if (!index.person.has(focal)) throw new Error(`no such person: ${focal}`);
  const up = opts.maxAncestors ?? DEFAULT_MAX_ANCESTORS;
  const down = opts.maxDescendants ?? DEFAULT_MAX_DESCENDANTS;
  const all: ChildFilter = () => true;
  const canopy = canopyCounts(index, focal, down, all);
  const roots = rootCounts(index, focal, up);
  let population = 0;
  for (const v of canopy.values()) population += v;
  for (const v of roots.values()) population += v;
  const f = frame(population);
  const b = new Builder();
  const ground = b.add([0, 0, 0], -1, null);
  const trunk = b.add([0, f.trunkHeight, 0], ground, focal, 0);
  placeCanopy(index, b, f, canopy, down, all, focal, trunk, 0, 0, 2 * Math.PI, new Map());
  placeRoots(index, b, f, roots, up, focal, ground, 0, 0, 2 * Math.PI);
  return finish(b, `home:${focal}`, f);
}

/**
 * A line's tree: its founder at the trunk top, everyone born into the line
 * above, married-in spouses as twigs.
 *
 * :param lineId: A line from the catalog.
 * :param opts.maxDescendants: Generations above the founder; Infinity (the
 *     default) draws the whole line, since the line itself bounds it.
 * :throws: For an unknown line.
 */
export function lineTree(index: FamilyIndex, lineId: string, opts: { maxDescendants?: number } = {}): FamilyTree {
  const line = index.line.get(lineId);
  if (!line || !line.members.length) throw new Error(`no such line: ${lineId}`);
  const founder = line.members[0]!;
  const down = opts.maxDescendants ?? Infinity;
  const keep: ChildFilter = (c) => index.person.get(c)?.line === lineId;
  const canopy = canopyCounts(index, founder, down, keep);
  let population = 0;
  for (const v of canopy.values()) population += v;
  const f = frame(population);
  const b = new Builder();
  const ground = b.add([0, 0, 0], -1, null);
  const trunk = b.add([0, f.trunkHeight, 0], ground, founder, 0);
  placeCanopy(index, b, f, canopy, down, keep, founder, trunk, 0, 0, 2 * Math.PI, new Map());
  return finish(b, `line:${lineId}`, f);
}
