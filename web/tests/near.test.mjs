import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const build = process.env.FOREST_TEST_BUILD;

test("near points are within reach; a point already near stays until past release", () => {
  const { nearSet } = require(`${build}/near.js`);
  const pts = [{ x: 0, z: 10 }, { x: 0, z: 60 }, { x: 0, z: 80 }, { x: 0, z: 100 }];
  const first = nearSet(pts, 0, 0, 70, 90, new Set());
  assert.deepEqual([...first].sort(), [0, 1]);
  // The cart moves back 15 m: the sign at 60 is now 75 away, inside release, and stays.
  const next = nearSet(pts, 0, -15, 70, 90, first);
  assert.deepEqual([...next].sort(), [0, 1]);
  // A sign never near does not enter at 75 even though it is inside release.
  assert.ok(!nearSet([{ x: 0, z: 75 }], 0, 0, 70, 90, new Set()).has(0));
  // Past release it goes.
  assert.deepEqual([...nearSet(pts, 0, -35, 70, 90, next)].sort(), [0]);
});

test("a grove's monogram is its label's first letter, in capitals, and every letter has an atlas cell", () => {
  const { monogramLetter, monogramCell, MONOGRAM_LETTERS, ATLAS_COLS, ATLAS_ROWS } = require(`${build}/monogram.js`);
  assert.equal(monogramLetter("Kennedy"), "K");
  assert.equal(monogramLetter("de Courtenay"), "D");
  assert.equal(monogramLetter("(-----)"), "?");
  assert.equal(monogramLetter("Élan"), "?", "letters outside A to Z show the fallback cell");
  assert.ok(MONOGRAM_LETTERS.length <= ATLAS_COLS * ATLAS_ROWS);
  const cells = new Set();
  for (const c of MONOGRAM_LETTERS) {
    const { u0, v0, u1, v1 } = monogramCell(c);
    assert.ok(u0 >= 0 && u1 <= 1 && v0 >= 0 && v1 <= 1 && u1 > u0 && v1 > v0, c);
    cells.add(`${u0.toFixed(3)},${v0.toFixed(3)}`);
  }
  assert.equal(cells.size, MONOGRAM_LETTERS.length, "no two letters share a cell");
  assert.deepEqual(monogramCell("~"), monogramCell("?"));
});
