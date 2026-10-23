import { clamp } from "./math";

export type Vec3 = { x: number; y: number; z: number };

export type Skeleton = {
  nodes: Float32Array;
  parents: Int32Array;
  radii: Float32Array;
  n: number;
};

export type GrownTree = {
  skeleton: Skeleton;
  crown: Float32Array;
  /** Where each leaf's stalk meets its twig. */
  leafPoints: Float32Array;
  /** Unit stalk-to-tip direction per leaf: out from the twig and toward the sky. */
  leafDirs: Float32Array;
  leafTint: Uint8Array;
  nLeaves: number;
  /** People on the tree; leaf size shrinks with it, as in the Python viz3d. */
  nChunks: number;
  /** Internode length, for the crown-shyness padding between trees. */
  step: number;
  trunkHeight: number;
  trunkRadius: number;
};

/** Bump when the geometry changes so the forest cache rebuilds. */
export const GROW_VERSION = 17;

// The orchard's trees are laid out, not grown: familyTree.ts places every
// person and uses the kinship graph as the wood. This file keeps what turns
// that wood into a mesh: pipe-model radii, the bark sweep and the leaves.

/** treegeom.LEAF_REFERENCE_COUNT: leaves shrink as (600 / people) ** (1/3) beyond it. */
export const LEAF_REFERENCE_COUNT = 600;

// Trunk radius floor as a fraction of height, for very small trees.
const TRUNK_PER_HEIGHT = 0.028;
/** Thinnest bark drawn, in metres (the 2 cm pipe-model tips vanish on screen). */
const TWIG_MIN_R = 0.035;

export const cellKey3 = (i: number, j: number, k: number) => ((i + 32768) * 65536 + (j + 32768)) * 65536 + (k + 32768);

/**
 * Pipe-model radii, parent^e = sum child^e (e = 2 is Leonardo's rule), then
 * thickened toward the height floor. Radii depend only on topology.
 */
export function pipeRadii(parents: Int32Array, n: number, tipRadius: number, pipeExp: number, trunkHeight: number): Float32Array {
  const radii = new Float32Array(n);
  radii.fill(tipRadius);
  // Walk children -> parent. Children have higher indices, so each node's own
  // radius is final before it is added to its parent.
  const childSum = new Float32Array(n);
  for (let i = n - 1; i >= 1; i--) {
    if (childSum[i]! > 0) radii[i] = childSum[i]! ** (1 / pipeExp);
    const p = parents[i]!;
    if (p >= 0) childSum[p] += radii[i]! ** pipeExp;
  }
  if (childSum[0]! > 0) radii[0] = childSum[0]! ** (1 / pipeExp);
  // Tip count does not grow with the book, so tall trees came out spindly.
  // Thicken toward the floor in proportion to each segment's share of the
  // trunk, so the trunk reaches it and twigs stay nearly unchanged.
  const base = radii[0]!;
  const f = Math.max(TRUNK_PER_HEIGHT * trunkHeight, 0.18) / base;
  if (f > 1) for (let i = 0; i < n; i++) radii[i] = radii[i]! * (1 + (f - 1) * (radii[i]! / base));
  return radii;
}

export type BarkBuffers = { pos: number[]; normal: number[]; uv: number[]; index: number[] };

// World width one bark texture tile covers around a trunk.
const BARK_TILE = 0.9;

/**
 * Sweep the skeleton into continuous tapered tubes with bark UVs, after
 * ez-tree's branch sweep (github.com/dgreenheck/ez-tree, MIT): rings of
 * vertices per section, a duplicated seam vertex for UV continuity, quads
 * between rings. Each chain follows the thickest child; the other children
 * start new chains at the fork. Rings are parallel-transported so the bark
 * does not twist. `aspect` is the bark image's height / width, and `tile` the
 * width in metres one repeat of it spans around a trunk. Returns the number
 * of vertices added.
 */
export function emitBark(grown: Pick<GrownTree, "skeleton">, originX: number, originZ: number, out: BarkBuffers, aspect: number, tile = BARK_TILE): number {
  const { nodes, parents, radii, n } = grown.skeleton;
  const children: number[][] = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) if (parents[i]! >= 0) children[parents[i]!]!.push(i);
  const mainChild = (i: number) => {
    let best = -1;
    for (const c of children[i]!) if (best < 0 || radii[c]! > radii[best]!) best = c;
    return best;
  };

  const chains: number[][] = [];
  const follow = (from: number[]) => {
    const chain = from;
    for (let c = mainChild(chain[chain.length - 1]!); c >= 0; c = mainChild(c)) chain.push(c);
    return chain;
  };
  const trunk = follow([0]);
  chains.push(trunk);
  for (let ci = 0; ci < chains.length; ci++) {
    const chain = chains[ci]!;
    // A side chain's first node is the fork, whose other children its parent chain already queued.
    for (let k = ci === 0 ? 0 : 1; k < chain.length; k++) {
      const p = chain[k]!;
      const main = chain[k + 1];
      for (const c of children[p]!) if (c !== main) chains.push(follow([p, c]));
    }
  }

  const base0 = out.pos.length / 3;
  const P = (i: number, a: number) => nodes[i * 3 + a]!;
  for (const chain of chains) {
    const m = chain.length;
    if (m < 2) continue;
    const isTrunk = chain === trunk;
    // A side chain's first ring sits at the fork with the child's own radius,
    // so it tucks inside the parent instead of bulging out of it.
    const ringRadius = (k: number) => {
      const r = k === 0 && !isTrunk ? radii[chain[1]!]! : radii[chain[k]!]!;
      return isTrunk && k === 0 ? r * 1.3 : r; // root flare
    };
    const r0 = ringRadius(isTrunk ? 1 : 0);
    const R = r0 >= 0.2 ? 12 : r0 >= 0.07 ? 7 : 5;
    const around = Math.max(1, Math.round((2 * Math.PI * r0) / tile));
    const vScale = 1 / (aspect * ((2 * Math.PI * r0) / around)); // keep the tile's aspect
    const first = out.pos.length / 3;

    let nx = 0, ny = 0, nz = 0;
    let v = 0;
    for (let k = 0; k < m; k++) {
      const i = chain[k]!;
      const a = chain[Math.max(0, k - 1)]!;
      const b = chain[Math.min(m - 1, k + 1)]!;
      let tx = P(b, 0) - P(a, 0), ty = P(b, 1) - P(a, 1), tz = P(b, 2) - P(a, 2);
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;
      if (k === 0) {
        // Any vector perpendicular to the first tangent.
        if (Math.abs(ty) < 0.9) { nx = tz; ny = 0; nz = -tx; } else { nx = 0; ny = -tz; nz = ty; }
      } else {
        v += Math.hypot(P(i, 0) - P(chain[k - 1]!, 0), P(i, 1) - P(chain[k - 1]!, 1), P(i, 2) - P(chain[k - 1]!, 2)) * vScale;
      }
      // Parallel transport: drop the tangent component of the previous normal.
      const d = nx * tx + ny * ty + nz * tz;
      nx -= d * tx; ny -= d * ty; nz -= d * tz;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      // Twigs are drawn at least TWIG_MIN_R thick so they read on screen; the pipe radii are unchanged.
      const r = Math.max(ringRadius(k), TWIG_MIN_R);
      const y = isTrunk && k === 0 ? -0.15 : P(i, 1); // sink the root below the ground
      for (let j = 0; j <= R; j++) {
        const ang = (2 * Math.PI * j) / R;
        const c = Math.cos(ang), s = Math.sin(ang);
        const dx = c * nx + s * bx, dy = c * ny + s * by, dz = c * nz + s * bz;
        out.pos.push(originX + P(i, 0) + dx * r, y + dy * r, originZ + P(i, 2) + dz * r);
        out.normal.push(dx, dy, dz);
        out.uv.push((j / R) * around, v);
      }
    }
    const N = R + 1;
    for (let k = 0; k < m - 1; k++) {
      for (let j = 0; j < R; j++) {
        const a = first + k * N + j, b = a + 1, c = a + N, d = c + 1;
        out.index.push(a, b, c, b, d, c);
      }
    }
  }
  return out.pos.length / 3 - base0;
}

/**
 * Instance each leaf with its stalk (the shape's y = -1 end) on the twig and
 * its blade along leafDirs, rolled so the face turns to the sky.
 */
export function emitLeaves(
  grown: GrownTree,
  originX: number,
  originZ: number,
  destPos: number[],
  destScale: number[],
  destTint: number[],
  destQuat: number[],
  leafSize: number,
): number {
  // grow_tree_geometry: a dense crown tiled at full size is an opaque shell, so
  // leaves shrink with the book's chunk count beyond LEAF_REFERENCE_COUNT.
  const r = leafSize * Math.min(1, (LEAF_REFERENCE_COUNT / Math.max(grown.nChunks, 1)) ** (1 / 3));
  let count = 0;
  for (let i = 0; i < grown.nLeaves; i++) {
    const jitter = 0.78 + (grown.leafTint[i]! / 8) * 0.5;
    const sx = r * 1.12 * jitter, sy = r * 1.78 * jitter;
    // Leaf frame: y along the blade, z the face normal as close to world up as y allows.
    const yx = grown.leafDirs[i * 3]!, yy = grown.leafDirs[i * 3 + 1]!, yz = grown.leafDirs[i * 3 + 2]!;
    let zx = -yy * yx, zy = 1 - yy * yy, zz = -yy * yz;
    const zl = Math.hypot(zx, zy, zz);
    if (zl < 1e-4) { zx = 1; zy = 0; zz = 0; } else { zx /= zl; zy /= zl; zz /= zl; }
    const xx = yy * zz - yz * zy, xy = yz * zx - yx * zz, xz = yx * zy - yy * zx;
    quatFromBasis(xx, xy, xz, yx, yy, yz, zx, zy, zz, destQuat);
    destPos.push(
      originX + grown.leafPoints[i * 3]! + yx * sy,
      grown.leafPoints[i * 3 + 1]! + yy * sy,
      originZ + grown.leafPoints[i * 3 + 2]! + yz * sy,
    );
    destScale.push(sx, sy, r * 0.22);
    destTint.push(grown.leafTint[i]!);
    count++;
  }
  return count;
}

/** Quaternion (x, y, z, w) of the rotation whose columns are the given basis. */
function quatFromBasis(
  m00: number, m10: number, m20: number,
  m01: number, m11: number, m21: number,
  m02: number, m12: number, m22: number,
  out: number[],
) {
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) {
    const s = 0.5 / Math.sqrt(tr + 1);
    w = 0.25 / s; x = (m21 - m12) * s; y = (m02 - m20) * s; z = (m10 - m01) * s;
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s;
  }
  out.push(x, y, z, w);
}

export { clamp };
