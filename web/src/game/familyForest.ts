// Turns the family layouts (familyTree.ts) into what the forest renderer
// already draws: a line tree becomes a GrownTree whose leaves are tufts at
// each person, and the home hourglass becomes the hub tree (a CorpusTree) with
// a glass pit sized to its roots.
//
import type { CorpusTree } from "./corpusTree";
import { REDWOOD_BARK } from "./corpusTree";
import type { FamilyIndex, FamilyLine } from "./familyCatalog";
import type { FamilyTree } from "./familyTree";
import { emitBark, type BarkBuffers, type GrownTree } from "./growTree";
import { mulberry32, seedFromKey } from "./math";
import { SPECIES } from "./species";

/** Leaves drawn per person: one leaf is invisible at driving distance. */
export const LEAVES_PER_PERSON = 7;
/** How far a person's tuft spreads around their node, m. */
const TUFT_RADIUS = 0.45;
/** Glass pit: clear ground kept around the deepest, widest root, m. */
const PIT_MARGIN = 1.5;
/** Foliage sprays per person on the home tree. */
const SPRAYS_PER_PERSON = 4;

/** The species a surname grows as: fixed by its name, so a family keeps it across rebuilds. */
export function speciesForSurname(surname: string): number {
  return seedFromKey(surname.toLowerCase()) % SPECIES.length;
}

/** Unit vector from a person's wood toward the sky: the leaves' stalk direction. */
function outward(tree: FamilyTree, node: number): [number, number, number] {
  const { nodes, parents } = tree.skeleton;
  const p = parents[node]!;
  let dx = 0, dy = 1, dz = 0;
  if (p >= 0) {
    dx = nodes[node * 3]! - nodes[p * 3]!;
    dy = nodes[node * 3 + 1]! - nodes[p * 3 + 1]!;
    dz = nodes[node * 3 + 2]! - nodes[p * 3 + 2]!;
  }
  // Half along the limb, half up: a tuft faces outward and to the light.
  const l = Math.hypot(dx, dy, dz) || 1;
  const x = dx / l, y = dy / l + 1, z = dz / l;
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}

/**
 * A line's tree as the renderer's GrownTree: the hourglass wood, and a tuft of
 * leaves at every person, shaded by generation.
 *
 * :param key: Seeds the tufts.
 */
export function lineGrown(tree: FamilyTree, key: string): GrownTree {
  const rng = mulberry32(seedFromKey(`${key}:tufts`));
  const n = tree.people.length * LEAVES_PER_PERSON;
  const leafPoints = new Float32Array(n * 3);
  const leafDirs = new Float32Array(n * 3);
  const leafTint = new Uint8Array(n);
  let k = 0;
  for (const p of tree.people) {
    const [ox, oy, oz] = outward(tree, p.node);
    for (let j = 0; j < LEAVES_PER_PERSON; j++, k++) {
      const a = rng() * 2 * Math.PI, r = TUFT_RADIUS * Math.sqrt(rng());
      leafPoints.set([p.x + r * Math.cos(a), p.y + 0.15 * (rng() - 0.5), p.z + r * Math.sin(a)], k * 3);
      const jx = ox + 0.6 * (rng() - 0.5), jy = oy + 0.3 * rng(), jz = oz + 0.6 * (rng() - 0.5);
      const m = Math.hypot(jx, jy, jz) || 1;
      leafDirs.set([jx / m, jy / m, jz / m], k * 3);
      leafTint[k] = Math.min(7, Math.max(0, p.generation + (p.marriedIn ? 1 : 0) + Math.floor(rng() * 2)));
    }
  }
  return {
    skeleton: tree.skeleton,
    crown: new Float32Array(0),
    leafPoints,
    leafDirs,
    leafTint,
    nLeaves: n,
    nChunks: tree.people.length,
    // Internode length, for shyLayout's padding: a curve segment.
    step: 0.6 * tree.scale,
    trunkHeight: tree.trunkHeight,
    trunkRadius: tree.skeleton.radii[1] ?? 0.2,
  };
}

/** What the HUD, search, reader and album know of a line's tree. */
export type LineCard = {
  /** The line id, as the catalog and `?tree=` name it. */
  slug: string;
  title: string;
  surname: string;
  /** The grove: the surname, case-folded. */
  grove: string;
  /** The founder and the founder's spouses, by name. */
  founders: string;
  members: number;
  /** "1823-1963", or "" when no member has a birth year. */
  span: string;
  summary: string;
  /** Member ids, founder first. */
  people: string[];
  /** Each member's name and years, founder first, for the reader's list. */
  roster: { id: string; name: string; years: string }[];
  /** Lower-cased names, birthplaces and years of every member, for the lantern. */
  search: string;
};

/** A line's card: its people, by name, for every place the UI shows a tree. */
export function lineCard(index: FamilyIndex, line: FamilyLine): LineCard {
  const founders = line.founders.map((id) => index.person.get(id)?.name ?? id).join(" & ");
  const span = line.span ? `${line.span[0]}-${line.span[1]}` : "";
  const placeName = new Map(index.catalog.places.map((p) => [p.id, p.name]));
  const terms = [line.surname];
  for (const id of line.members) {
    const p = index.person.get(id);
    if (!p || p.living) continue;
    terms.push(p.name, p.born ?? "", p.died ?? "", p.birth_place ? placeName.get(p.birth_place) ?? "" : "");
  }
  const born = line.members.length === 1 ? "one person" : `${line.members.length} people`;
  return {
    slug: line.id,
    title: `The ${line.surname} line`,
    surname: line.surname,
    grove: line.grove,
    founders,
    members: line.members.length,
    span,
    summary: `${born} born a ${line.surname}${span ? `, ${span}` : ""}, from ${founders}.`,
    people: line.members,
    roster: line.members.map((id) => {
      const p = index.person.get(id);
      const years = p && !p.living && (p.born || p.died) ? `${p.born ?? "?"}-${p.died ?? ""}` : "";
      return { id, name: p?.name ?? id, years };
    }),
    search: terms.filter(Boolean).join(" | ").toLowerCase(),
  };
}

/** The hub tree with the glass pit its roots need. */
export type HomeTree = CorpusTree & {
  /** The trunk person, by id and by name. */
  focal: string;
  focalName: string;
  /** Radius of the glass floor and the pit under it, m. */
  pitRadius: number;
  /** Depth of the pit floor below ground, m. */
  pitDepth: number;
};

/**
 * The home hourglass as the hub tree the renderer draws: bark from the
 * kinship wood, a foliage spray per person, and a pit wide and deep enough to
 * show every root through the glass.
 */
export function homeTree(tree: FamilyTree, focal: string, lines: number, focalName = focal): HomeTree {
  const { nodes, radii, n } = tree.skeleton;
  let height = 0, reach = 0, depth = 0;
  for (let i = 0; i < n; i++) {
    const x = nodes[i * 3]!, y = nodes[i * 3 + 1]!, z = nodes[i * 3 + 2]!;
    height = Math.max(height, y);
    if (y < 0) {
      depth = Math.max(depth, -y);
      reach = Math.max(reach, Math.hypot(x, z));
    }
  }
  const bark: BarkBuffers = { pos: [], normal: [], uv: [], index: [] };
  emitBark({ skeleton: tree.skeleton }, 0, 0, bark, REDWOOD_BARK.aspect, REDWOOD_BARK.tile);

  const rng = mulberry32(seedFromKey(`home:${focal}:sprays`));
  const count = tree.people.length * SPRAYS_PER_PERSON;
  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count * 3);
  const quat = new Float32Array(count * 4);
  const shade = new Uint8Array(count);
  let k = 0;
  for (const p of tree.people) {
    for (let j = 0; j < SPRAYS_PER_PERSON; j++, k++) {
      const yaw = rng() * 2 * Math.PI, tilt = (rng() - 0.5) * 0.6;
      pos.set([p.x + 0.3 * Math.cos(yaw), p.y + 0.1 * (rng() - 0.5), p.z + 0.3 * Math.sin(yaw)], k * 3);
      scale.set([0.9 * tree.scale, 1, 0.35 * tree.scale], k * 3);
      // Yaw about y, then a small tilt about the spray's own x.
      const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2), ct = Math.cos(tilt / 2), st = Math.sin(tilt / 2);
      quat.set([cy * st, sy * ct, -sy * st, cy * ct], k * 4);
      shade[k] = Math.min(7, Math.abs(p.generation) + Math.floor(rng() * 2));
    }
  }

  const trunkRadius = radii[1] ?? 0.4;
  return {
    height,
    totalChunks: tree.people.length,
    limbs: lines,
    trunkRadius,
    // The cart is kept off the trunk only; it drives over the glass.
    baseRadius: trunkRadius * 1.6,
    bark: {
      count: bark.pos.length / 3,
      pos: new Float32Array(bark.pos),
      normal: new Float32Array(bark.normal),
      uv: new Float32Array(bark.uv),
      index: new Uint32Array(bark.index),
    },
    foliage: { count, pos, scale, quat, shade },
    focal,
    focalName,
    pitRadius: Math.max(4, reach + PIT_MARGIN),
    pitDepth: Math.max(2, depth + PIT_MARGIN),
  };
}
