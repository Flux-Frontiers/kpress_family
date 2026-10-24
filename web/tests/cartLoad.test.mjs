import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { cartLoad, cartBoxHalfExtents, leather, ALBUM_PARTS, BED_FLOOR, CART_ALBUMS, CART_CAPACITY, LOAD_CAP } =
  require(`${process.env.FOREST_TEST_BUILD}/cartLoad.js`);

// The Kennedy file has 47 lines; a bigger family has a few hundred.
const LINES = 120;
const slugs = Array.from({ length: LINES }, (_, k) => `line-${k}-I${(k * 7919) % 1013}`);
const colorOf = (slug) => `#${(slug.length * 1234567 % 0xffffff).toString(16).padStart(6, "0")}`;

/** The box's rotated bounding box in the cart's frame. */
function bounds(b) {
  const e = cartBoxHalfExtents(b);
  return { x0: b.x - e.x, x1: b.x + e.x, y0: b.y - e.y, y1: b.y + e.y, z0: b.z - e.z, z1: b.z + e.z };
}

/** Does the box's bounding box cut the region? */
function cuts(b, r) {
  const a = bounds(b);
  return a.x1 > r.x0 && a.x0 < r.x1 && a.y1 > r.y0 && a.y0 < r.y1 && a.z1 > r.z0 && a.z0 < r.z1;
}

/** The boxes of album k. */
const albumOf = (load, k) => load.slice(k * ALBUM_PARTS, (k + 1) * ALBUM_PARTS);

test("an empty album carries nothing, and n lines give n albums", () => {
  assert.deepEqual(cartLoad([], colorOf), []);
  for (const n of [1, 2, 17, 18, 19, 47, 100, LINES]) {
    assert.equal(cartLoad(slugs.slice(0, n), colorOf).length, n * ALBUM_PARTS);
  }
});

test("the cart holds 162 albums and drops lines past that", () => {
  assert.equal(CART_ALBUMS, 162);
  assert.equal(CART_CAPACITY, CART_ALBUMS * ALBUM_PARTS);
  const many = Array.from({ length: CART_ALBUMS + 20 }, (_, k) => `extra-${k}`);
  assert.equal(cartLoad(many, colorOf).length, CART_CAPACITY);
});

test("an album's cover and spine wear its line's grove color as leather; pages are cream, corners brass", () => {
  const load = cartLoad(slugs.slice(0, 10), colorOf);
  for (let k = 0; k < 10; k++) {
    const colors = albumOf(load, k).map((b) => b.color);
    const cover = leather(colorOf(slugs[k]));
    assert.deepEqual(colors.slice(0, 3), [cover, cover, cover]);
    assert.deepEqual(colors.slice(3), ["#efe6cf", "#b08a3e", "#b08a3e"]);
  }
});

test("an album lies flat and is wider than it is tall", () => {
  const [bottom] = cartLoad(slugs.slice(0, 1), colorOf);
  assert.ok(bottom.w > bottom.d, "wider across than deep");
  assert.equal(bottom.lean, 0);
});

test("adding one more line adds one album and moves none", () => {
  const full = cartLoad(slugs, colorOf);
  for (let k = 0; k < LINES; k++) {
    const n = (k + 1) * ALBUM_PARTS;
    assert.deepEqual(cartLoad(slugs.slice(0, k + 1), colorOf).slice(0, n - ALBUM_PARTS), full.slice(0, n - ALBUM_PARTS), `after ${k + 1} lines`);
  }
});

test("the same album gives the same load", () => {
  assert.deepEqual(cartLoad(slugs, colorOf), cartLoad([...slugs], colorOf));
});

test("every album sits inside the bed, on the floor or another album, under the cap", () => {
  const all = Array.from({ length: CART_ALBUMS }, (_, k) => `full-${k}`);
  const load = cartLoad(all, colorOf);
  load.forEach((b, i) => {
    const a = bounds(b);
    // The side rails stand at 0.55 m; the tailboard and front board at -0.9 and 0.9, 0.05 m thick.
    assert.ok(-a.x0 <= 0.55 && a.x1 <= 0.55, `box ${i} x ${a.x0.toFixed(3)}..${a.x1.toFixed(3)}`);
    assert.ok(a.z0 >= -0.875 && a.z1 <= 0.875, `box ${i} z ${a.z0.toFixed(3)}..${a.z1.toFixed(3)}`);
    // The brass corners stand a millimetre proud of the covers.
    assert.ok(a.y0 >= BED_FLOOR - 0.0011, `box ${i} bottom ${a.y0.toFixed(4)}`);
    assert.ok(a.y1 <= LOAD_CAP, `box ${i} top ${a.y1.toFixed(3)}`);
  });
  // The first album lies on the floor.
  assert.ok(Math.abs(bounds(load[0]).y0 - BED_FLOOR) < 1e-9);
});

test("the view from the seat and from behind is clear: nothing stands in 1.3 to 1.65 m", () => {
  const slab = { x0: -1, x1: 1, y0: 1.3, y1: 1.65, z0: -0.45, z1: 0.9 };
  const all = Array.from({ length: CART_ALBUMS }, (_, k) => `full-${k}`);
  for (const b of cartLoad(all, colorOf)) assert.ok(!cuts(b, slab));
});

test("the lantern's hook and lamp are clear of the load", () => {
  // The hook stands at x -0.46, z 0.84; the lamp hangs at x -0.2, z 0.84, from
  // 1.13 m up, with a 0.1 m radius.
  const hook = { x0: -0.5, x1: -0.42, y0: 0.48, y1: 1.5, z0: 0.8, z1: 0.88 };
  const lamp = { x0: -0.32, x1: -0.08, y0: 1.13, y1: 1.4, z0: 0.72, z1: 0.96 };
  const all = Array.from({ length: CART_ALBUMS }, (_, k) => `full-${k}`);
  for (const b of cartLoad(all, colorOf)) {
    assert.ok(!cuts(b, hook));
    assert.ok(!cuts(b, lamp));
  }
});

test("no two albums overlap", () => {
  // Each album's parts lie within its own bounding box; albums must not share space.
  const all = Array.from({ length: CART_ALBUMS }, (_, k) => `full-${k}`);
  const load = cartLoad(all, colorOf);
  const boxes = Array.from({ length: CART_ALBUMS }, (_, k) => {
    const parts = albumOf(load, k).map(bounds);
    return {
      x0: Math.min(...parts.map((p) => p.x0)), x1: Math.max(...parts.map((p) => p.x1)),
      y0: Math.min(...parts.map((p) => p.y0)), y1: Math.max(...parts.map((p) => p.y1)),
      z0: Math.min(...parts.map((p) => p.z0)), z1: Math.max(...parts.map((p) => p.z1)),
    };
  });
  // Turned albums' bounding boxes overlap a little where the albums do not.
  const tol = 0.004;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      const oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
      assert.ok(!(ox > tol && oy > tol && oz > tol), `albums ${i} and ${j} overlap by ${ox.toFixed(3)}, ${oy.toFixed(3)}, ${oz.toFixed(3)}`);
    }
  }
});

test("leather keeps a grove's hue and darkens it", () => {
  assert.equal(leather("#ffffff"), "#9d938c");
  assert.equal(leather("#3a2618"), "#3a2618");
  const red = leather("#e05050");
  assert.ok(parseInt(red.slice(1, 3), 16) > parseInt(red.slice(3, 5), 16), `still red: ${red}`);
  assert.equal(leather("not a color"), "not a color");
});
