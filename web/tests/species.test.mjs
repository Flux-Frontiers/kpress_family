import { orchardArgs } from "./orchard.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

test("each grove is one render chunk: one species, its trees' bark, a contiguous leaf range", () => {
  globalThis.window ??= { localStorage: { getItem: () => null, setItem() {} } };
  const { getForest } = require(`${process.env.FOREST_TEST_BUILD}/forest.js`);
  const { speciesForSurname } = require(`${process.env.FOREST_TEST_BUILD}/familyForest.js`);
  const forest = getForest(...orchardArgs());
  assert.equal(forest.chunks.length, forest.groves.length);
  const used = forest.chunks.map(() => 0);
  for (const t of forest.trees) {
    const chunk = forest.chunks[t.chunk];
    // A grove is a surname; its species is fixed by the name.
    assert.equal(t.species, speciesForSurname(t.line.surname));
    assert.equal(chunk.species, t.species, `${t.line.slug}: grove species differs`);
    assert.equal(chunk.genre, t.line.grove);
    assert.ok(t.woodStart + t.woodCount <= chunk.bark.count);
    assert.ok(t.leafStart >= chunk.leafStart && t.leafStart + t.leafCount <= chunk.leafStart + chunk.leafCount);
    // The chunk's radius must hold the trunk, or distance culling could drop a visible tree.
    assert.ok(Math.hypot(t.x - chunk.x, t.z - chunk.z) < chunk.radius);
    used[t.chunk] += t.woodCount;
  }
  assert.deepEqual(used, forest.chunks.map((c) => c.bark.count));
  assert.equal(forest.chunks.reduce((a, c) => a + c.leafCount, 0), forest.leaves.count);
  for (let i = 0; i < forest.leaves.count; i++) {
    assert.equal(forest.leaves.species[i], forest.trees[forest.leaves.treeIndex[i]].species);
  }
});


test("leaf outlines are closed, mirror-symmetric and have real area", () => {
  const { SPECIES, leafOutline } = require(`${process.env.FOREST_TEST_BUILD}/species.js`);
  const area = (pts) => Math.abs(pts.reduce((a, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; return a + x * v - u * y; }, 0)) / 2;
  const areas = {};
  for (const s of SPECIES) {
    const pts = leafOutline(s.leaf);
    assert.ok(pts.length >= 8, `${s.name}: ${pts.length} points`);
    assert.ok(pts.every(([x, y]) => Math.abs(x) <= 2 && Math.abs(y) <= 1.05), `${s.name}: outline out of bounds`);
    const maxX = Math.max(...pts.map((p) => p[0])), minX = Math.min(...pts.map((p) => p[0]));
    assert.ok(Math.abs(maxX + minX) < 1e-6, `${s.name}: not symmetric`);
    areas[s.name] = area(pts);
  }
  // The single-needle fir leaf was ~0.2 of a chestnut leaf; a spray should hold its own.
  assert.ok(areas.fir > 0.5 * areas.chestnut, `fir ${areas.fir} vs chestnut ${areas.chestnut}`);
});
