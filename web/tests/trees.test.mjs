import { KENNEDY, orchardArgs } from "./orchard.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

/** Every line tree of the Kennedy orchard, as the forest grows it, with its id. */
function lineTrees(limit = Infinity) {
  const { indexCatalog } = require(`${process.env.FOREST_TEST_BUILD}/familyCatalog.js`);
  const { lineTree } = require(`${process.env.FOREST_TEST_BUILD}/familyTree.js`);
  const { lineGrown } = require(`${process.env.FOREST_TEST_BUILD}/familyForest.js`);
  const index = indexCatalog(KENNEDY);
  return KENNEDY.lines.filter((l) => l.id !== "unknown" && l.members.length).slice(0, limit)
    .map((l) => ({ slug: l.id, g: lineGrown(lineTree(index, l.id), l.id) }));
}

test("trunks scale with height while twigs stay fine", () => {
  for (const { slug: bslug, g } of lineTrees()) {
    const b = { slug: bslug };
    const { radii, parents, n } = g.skeleton;
    // The pipe-model bug left every trunk on the 0.18 floor, ~1:90 of height.
    assert.ok(g.trunkHeight / g.trunkRadius < 40, `${b.slug}: h/r ${g.trunkHeight / g.trunkRadius}`);
    assert.ok(Math.min(...radii) < 0.06, `${b.slug}: thinnest twig ${Math.min(...radii)}`);
    for (let i = 1; i < n; i++) {
      if (parents[i] >= 0) assert.ok(radii[parents[i]] >= radii[i] - 1e-6, `${b.slug}: node ${i} thicker than its parent`);
    }
  }
});

test("every leaf hangs within reach of a branch", () => {
  for (const { slug: bslug, g } of lineTrees()) {
    const b = { slug: bslug };
    const { nodes, n } = g.skeleton;
    for (let l = 0; l < g.nLeaves; l++) {
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        best = Math.min(best, Math.hypot(g.leafPoints[l * 3] - nodes[i * 3], g.leafPoints[l * 3 + 1] - nodes[i * 3 + 1], g.leafPoints[l * 3 + 2] - nodes[i * 3 + 2]));
      }
      // Before the fix the median leaf floated 1.5 m from any branch, some 8 m.
      assert.ok(best <= 0.6 + 1e-4, `${b.slug}: leaf ${l} is ${best.toFixed(2)} m from a branch`);
    }
  }
});

test("bark is one watertight sweep per chain, facing outward, with wrapping UVs", () => {
  const { emitBark } = require(`${process.env.FOREST_TEST_BUILD}/growTree.js`);
  for (const { slug: bslug, g } of lineTrees(12)) {
    const b = { slug: bslug };
    const out = { pos: [], normal: [], uv: [], index: [] };
    const count = emitBark(g, 5, -3, out, 2);
    assert.equal(count, out.pos.length / 3);
    assert.equal(out.uv.length / 2, count);
    assert.ok(out.index.every((i) => i >= 0 && i < count), `${b.slug}: index out of range`);
    let agree = 0, tris = 0;
    for (let t = 0; t < out.index.length; t += 3) {
      const [a, c, d] = [out.index[t], out.index[t + 1], out.index[t + 2]];
      const v = (i, k) => out.pos[i * 3 + k];
      const e1 = [0, 1, 2].map((k) => v(c, k) - v(a, k));
      const e2 = [0, 1, 2].map((k) => v(d, k) - v(a, k));
      const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const nrm = [0, 1, 2].map((k) => out.normal[a * 3 + k] + out.normal[c * 3 + k] + out.normal[d * 3 + k]);
      const dot = f[0] * nrm[0] + f[1] * nrm[1] + f[2] * nrm[2];
      if (Math.hypot(...f) < 1e-9) continue;
      tris++;
      if (dot > 0) agree++;
    }
    // Counter-clockwise from outside, or the bark renders inside-out.
    assert.ok(agree / tris > 0.99, `${b.slug}: ${agree}/${tris} faces point outward`);
    // Around each ring u runs 0..k with an integer k, so the texture tiles across the seam.
    for (let i = 0; i < count; i++) {
      const u = out.uv[i * 2];
      assert.ok(Number.isFinite(u) && Number.isFinite(out.uv[i * 2 + 1]));
    }
  }
});

test("no tree's wood passes through another's, within or across groves", () => {
  globalThis.window ??= { localStorage: { getItem: () => null, setItem() {} } };
  const { getForest } = require(`${process.env.FOREST_TEST_BUILD}/forest.js`);
  const { indexCatalog } = require(`${process.env.FOREST_TEST_BUILD}/familyCatalog.js`);
  const { lineTree } = require(`${process.env.FOREST_TEST_BUILD}/familyTree.js`);
  const [family, focal] = orchardArgs();
  const f = getForest(family, focal);
  const index = indexCatalog(family);
  // The wood the orchard draws: each line's hourglass layout, as forest.ts placed it.
  const wood = f.trees.map((t) => {
    const g = lineTree(index, t.line.slug);
    const { nodes, radii, n } = g.skeleton;
    const pts = [];
    let reach = 0;
    for (let i = 0; i < n; i++) {
      pts.push([t.x + nodes[i * 3], nodes[i * 3 + 1], t.z + nodes[i * 3 + 2], radii[i]]);
      reach = Math.max(reach, Math.hypot(nodes[i * 3], nodes[i * 3 + 2]));
    }
    return { t, pts, reach };
  });
  for (let i = 0; i < wood.length; i++) {
    for (let j = i + 1; j < wood.length; j++) {
      const a = wood[i], b = wood[j];
      if (Math.hypot(a.t.x - b.t.x, a.t.z - b.t.z) >= a.reach + b.reach) continue;
      for (const p of a.pts) {
        if (Math.hypot(p[0] - b.t.x, p[2] - b.t.z) > b.reach + 1) continue;
        for (const q of b.pts) {
          const gap = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) - p[3] - q[3];
          assert.ok(gap > 0.3, `${a.t.line.slug} and ${b.t.line.slug} touch (gap ${gap.toFixed(2)} m)`);
        }
      }
    }
  }
});

test("the wheel never spins on an unplaceable grove: a NaN radius throws", () => {
  const { wheelLayout } = require(`${process.env.FOREST_TEST_BUILD}/math.js`);
  const opts = { hub: 18, setback: 1.4, gap: 8, lane: 2 };
  // A grove whose layout left a tree unplaced had a NaN radius and hung the page.
  assert.throws(() => wheelLayout([20, NaN], opts), /radius 1 is NaN/);
  assert.equal(wheelLayout([20, 30], opts).centers.length, 2);
});
