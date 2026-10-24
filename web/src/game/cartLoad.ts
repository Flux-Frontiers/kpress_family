/**
 * The lantern cart's cargo: the family albums the rider has collected, one
 * per line added to the album, lying flat in stacks in the bed.
 *
 * Pure layout, no React or three, so the tests can run it. Slot k belongs to
 * the k-th line added, and depends only on k and that line's slug, so adding
 * one more line adds one album and never moves the others.
 *
 * An album is a landscape volume, wider than tall: a cover in its grove's
 * color, top and bottom, with a spine along one long edge, a cream page block
 * between, and brass caps on the two fore-edge corners. Each part is a box,
 * so the cart draws every album as one InstancedMesh (Cart.tsx).
 *
 * The cart's local frame has forward as +z and the bed floor at y = 0.53. The
 * bed runs 1.04 m between the side rails and from the tailboard to the front
 * board. Albums stand in three columns across it and six rows along it, clear
 * of the lantern's hook at the front left, and stack no higher than LOAD_CAP,
 * below the lamp (bottom about 1.13 m) and the seat camera (1.65 m).
 */

/** One box of the load, placed in the cart's local frame. */
export type CartBox = {
  /** Center of the box in the cart's local frame, m. Forward is +z. */
  x: number;
  y: number;
  z: number;
  /** Box size along its own x, y and z, m. */
  w: number;
  h: number;
  d: number;
  /** Yaw about y and a small lean about z, radians. The box turns by yaw after the lean. */
  yaw: number;
  lean: number;
  color: string;
};

/** The top of the bed floor, m: the planks' upper face. */
export const BED_FLOOR = 0.53;
/** No album rises above this, m. */
export const LOAD_CAP = 1.2;

/** Albums across the bed, along it, and stacked. */
const COLS = 3;
const ROWS = 6;
const LAYERS = 9;
const COL_PITCH = 0.34;
const ROW_PITCH = 0.27;
/** Center of the first row, m: just clear of the tailboard. */
const ROW_Z0 = -0.74;
const LAYER_PITCH = 0.058;

/** An album's size: across the bed, along it, and thick, m. */
const ALBUM_W = 0.31;
const ALBUM_D = 0.24;
const ALBUM_T = 0.052;
const COVER = 0.006;
const SPINE = 0.01;
/** Pages stand in from the cover's three open edges by this much, m. */
const PAGE_INSET = 0.006;
const CORNER = 0.035;

/** Boxes drawn for each album. */
export const ALBUM_PARTS = 6;
/** How many albums the cart holds; lines added past this are not drawn. */
export const CART_ALBUMS = COLS * ROWS * LAYERS;
/** How many boxes the cart draws at most. */
export const CART_CAPACITY = CART_ALBUMS * ALBUM_PARTS;

/** The cover of an album whose line the caller cannot place. */
export const NEUTRAL_COVER = "#6b5a46";
const PAGES = "#efe6cf";
const BRASS = "#b08a3e";
/** Covers are the grove's color tanned toward this brown, by LEATHER_TAN: leather, not paint. */
const LEATHER = [0x3a, 0x26, 0x18];
const LEATHER_TAN = 0.5;

/**
 * A grove color as album leather: blended toward a dark brown, so the
 * grove's hue survives but a pastel reads as a bound cover.
 *
 * :param hex: "#rrggbb".
 */
export function leather(hex: string): string {
  const v = parseInt(hex.slice(1), 16);
  if (!/^#[0-9a-f]{6}$/i.test(hex) || Number.isNaN(v)) return hex;
  const rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  return "#" + rgb.map((c, i) => Math.round(c + (LEATHER[i]! - c) * LEATHER_TAN).toString(16).padStart(2, "0")).join("");
}

/** A 32-bit FNV-1a hash of a string. */
function hashSlug(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A repeatable number in [0, 1) for one purpose of one album.
 *
 * :param hash: the line's slug hash.
 * :param salt: which quantity this is, so offsets and angles are independent.
 */
function unit(hash: number, salt: number): number {
  let h = (hash ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Linear blend from a to b by t in [0, 1). */
function between(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Half the size of the box's bounding box in the cart's frame, m. The box is
 * rotated about z by lean, then about y by yaw.
 *
 * :param b: the box, of which only the size and the two angles are read.
 */
export function cartBoxHalfExtents(b: Pick<CartBox, "w" | "h" | "d" | "yaw" | "lean">): { x: number; y: number; z: number } {
  const cy = Math.abs(Math.cos(b.yaw));
  const sy = Math.abs(Math.sin(b.yaw));
  const cl = Math.abs(Math.cos(b.lean));
  const sl = Math.abs(Math.sin(b.lean));
  // Rows of R = Ry * Rz, absolute values, times the half sizes.
  const hw = b.w / 2;
  const hh = b.h / 2;
  const hd = b.d / 2;
  return {
    x: cy * cl * hw + cy * sl * hh + sy * hd,
    y: sl * hw + cl * hh,
    z: sy * cl * hw + sy * sl * hh + cy * hd,
  };
}

/**
 * The boxes of the album in slot k: its covers, spine, pages and corners,
 * all turned together by the album's small yaw about its own center.
 */
function album(k: number, hash: number, color: string): CartBox[] {
  const col = k % COLS;
  const row = Math.floor(k / COLS) % ROWS;
  const layer = Math.floor(k / (COLS * ROWS));
  const cx = (col - (COLS - 1) / 2) * COL_PITCH + between(-0.008, 0.008, unit(hash, 0));
  const cz = ROW_Z0 + row * ROW_PITCH + between(-0.006, 0.006, unit(hash, 1));
  const cy = BED_FLOOR + layer * LAYER_PITCH + ALBUM_T / 2;
  const yaw = between(-0.05, 0.05, unit(hash, 2));
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  // A part offset (dx, dy, dz) from the album's center, sized w x h x d.
  const part = (dx: number, dy: number, dz: number, w: number, h: number, d: number, c: string): CartBox => ({
    x: cx + dx * cos + dz * sin,
    y: cy + dy,
    z: cz - dx * sin + dz * cos,
    w, h, d, yaw, lean: 0, color: c,
  });
  const half = { w: ALBUM_W / 2, t: ALBUM_T / 2, d: ALBUM_D / 2 };
  const pageH = ALBUM_T - 2 * COVER;
  // The spine runs along the album's left long edge (-x); the fore edge is +x.
  const pageW = ALBUM_W - SPINE - PAGE_INSET;
  return [
    part(0, -half.t + COVER / 2, 0, ALBUM_W, COVER, ALBUM_D, color),
    part(0, half.t - COVER / 2, 0, ALBUM_W, COVER, ALBUM_D, color),
    part(-half.w + SPINE / 2, 0, 0, SPINE, pageH, ALBUM_D, color),
    part(-half.w + SPINE + pageW / 2, 0, 0, pageW, pageH, ALBUM_D - 2 * PAGE_INSET, PAGES),
    part(half.w - CORNER / 2, 0, half.d - CORNER / 2, CORNER, ALBUM_T + 0.002, CORNER, BRASS),
    part(half.w - CORNER / 2, 0, -half.d + CORNER / 2, CORNER, ALBUM_T + 0.002, CORNER, BRASS),
  ];
}

/**
 * Lay out the collected albums in the cart's bed, slot k for the k-th line
 * added: a layer of eighteen on the floor, then the next layer on top, and so
 * on. Past CART_ALBUMS the extra lines are not drawn.
 *
 * :param slugs: the lines in the album, in the order they were added.
 * :param colorOf: a line's grove color, by slug; its album wears it as leather.
 * :returns: ALBUM_PARTS boxes per album, album by album.
 */
export function cartLoad(slugs: readonly string[], colorOf: (slug: string) => string): CartBox[] {
  const out: CartBox[] = [];
  const n = Math.min(slugs.length, CART_ALBUMS);
  for (let k = 0; k < n; k++) out.push(...album(k, hashSlug(slugs[k]!), leather(colorOf(slugs[k]!))));
  return out;
}
