import { KENNEDY, orchardArgs } from "./orchard.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.window ??= { localStorage: { getItem: () => null, setItem() {} } };

const build = process.env.FOREST_TEST_BUILD;
const { indexCatalog } = require(`${build}/familyCatalog.js`);
const { lineTree } = require(`${build}/familyTree.js`);
const { getForest } = require(`${build}/forest.js`);
const { buildSchematic, pickBead, generationColor, LIVING_BEAD } = require(`${build}/schematic.js`);

const [family, focal] = orchardArgs();
const index = indexCatalog(family);
const forest = getForest(family, focal);
const schematic = buildSchematic(index, forest.trees, focal);

test("every person on every tree is a bead where the organic layout puts them", () => {
  forest.trees.forEach((t, i) => {
    const people = lineTree(index, t.line.slug).people;
    const beads = schematic.beads.filter((b) => b.tree === i);
    assert.equal(beads.length, people.length, t.line.slug);
    for (const p of people) {
      const b = beads.find((x) => x.id === p.id);
      assert.ok(b, `${t.line.slug}: ${p.id}`);
      assert.ok(Math.hypot(b.x - (t.x + p.x), b.y - p.y, b.z - (t.z + p.z)) < 1e-9);
    }
  });
  assert.ok(schematic.beads.some((b) => b.tree === -1 && b.id === focal), "the home tree's trunk person");
});

test("a bead's color is its generation; a living person's is gray and has no name", () => {
  for (const b of schematic.beads) {
    const living = index.person.get(b.id)?.living;
    if (living) {
      assert.equal(b.color, LIVING_BEAD);
      assert.equal(b.name, "");
    } else {
      assert.equal(b.color, generationColor(b.generation));
      assert.ok(b.name.length > 0, b.id);
    }
  }
  assert.ok(schematic.beads.some((b) => b.living), "the Kennedy file has living people");
  assert.notEqual(generationColor(0), generationColor(1));
  assert.equal(generationColor(-1), generationColor(7));
});

test("shape follows recorded sex", () => {
  for (const b of schematic.beads) {
    const sex = index.person.get(b.id)?.sex;
    assert.equal(b.shape, sex === "F" ? "round" : sex === "M" ? "square" : "diamond", b.id);
  }
});

test("every married-in spouse has a bar and everyone else a limb", () => {
  let married = 0, others = 0;
  forest.trees.forEach((t) => {
    for (const p of lineTree(index, t.line.slug).people) (p.marriedIn ? married++ : others++);
  });
  const home = schematic.beads.filter((b) => b.tree === -1).length;
  // The home tree's people all hang by limbs or bars too.
  assert.equal(schematic.bars.length + schematic.limbs.length, married + others + home);
  assert.ok(schematic.bars.length >= married);
});

test("each trunk rises from its tree's ground point", () => {
  forest.trees.forEach((t) => {
    assert.ok(schematic.limbs.some((s) => s.ay === 0 && s.ax === t.x && s.az === t.z), t.line.slug);
  });
});

test("a ray picks the nearest bead it passes through, and misses past them all", () => {
  const b = schematic.beads.find((x) => x.tree === 0);
  const origin = { x: b.x, y: b.y + 0.6, z: b.z };
  assert.equal(pickBead(schematic.beads, origin, { x: 0, y: -1, z: 0 }, 0.45, 200)?.id, b.id);
  assert.equal(pickBead(schematic.beads, { x: 0, y: 500, z: 0 }, { x: 0, y: 1, z: 0 }, 0.45, 200), null);
  assert.ok(KENNEDY.people.length > 0);
});
