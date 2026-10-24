// The family layout against a real `genkg export-web` of genealogy_kg's
// invented fixture: John Hartwell (I1) and Mary Ashcombe (I2) found the
// Hartwell line; Anna Kessler (I6), Samuel Pryce (I9) and Louise Brandt (I11)
// married into it. Robert (I7) has parents I3 and I6 and grandparents I1 and
// I2; I8 is his sibling, I4 and I5 his aunts. Eliza (I4) married Samuel Pryce,
// so their daughter Edith (I10) is a Pryce.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const build = process.env.FOREST_TEST_BUILD;
const { indexCatalog, parentsOf, childrenOf, defaultFocal, UNKNOWN_LINE } = require(`${build}/familyCatalog.js`);
const { hourglassTree, lineTree, EDGE_SUBDIVISIONS } = require(`${build}/familyTree.js`);

const catalog = JSON.parse(readFileSync(new URL("./fixtures/family/catalog.json", import.meta.url)));
const index = indexCatalog(catalog);

/** The person whose node a wood path from `node` toward the ground reaches first. */
function personAbove(tree, node) {
  const byNode = new Map(tree.people.map((p) => [p.node, p.id]));
  for (let i = tree.skeleton.parents[node]; i >= 0; i = tree.skeleton.parents[i]) {
    if (byNode.has(i)) return byNode.get(i);
  }
  return null;
}

function isKin(a, b) {
  const spouses = (x) => (index.familiesOf.get(x) ?? []).flatMap((f) => index.family.get(f).spouses);
  return parentsOf(index, a).includes(b) || parentsOf(index, b).includes(a) || spouses(a).includes(b);
}

test("the index walks parents and children", () => {
  assert.deepEqual(parentsOf(index, "I7"), ["I3", "I6"]);
  assert.deepEqual(childrenOf(index, "F1"), ["I3", "I4", "I5"]);
  assert.equal(defaultFocal(catalog), "I1");
});

test("the hourglass holds exactly the focal person's ancestors and descendants", () => {
  const tree = hourglassTree(index, "I7");
  const ids = new Set(tree.people.map((p) => p.id));
  const ancestors = tree.people.filter((p) => p.generation < 0).map((p) => p.id).sort();
  assert.deepEqual(ancestors, ["I1", "I2", "I3", "I6"]);
  for (const collateral of ["I8", "I4", "I5", "I9", "I10"]) assert.ok(!ids.has(collateral), collateral);
  assert.ok(ids.has("I11") && ids.has("I12"));
});

test("roots hang below the ground and the canopy rises above the trunk (Y up)", () => {
  const tree = hourglassTree(index, "I7");
  for (const p of tree.people) {
    if (p.generation < 0) assert.ok(p.y < 0, `${p.id} y=${p.y}`);
    else assert.ok(p.y >= tree.trunkHeight - 1e-6, `${p.id} y=${p.y}`);
  }
  const g = (id) => tree.people.find((p) => p.id === id);
  assert.ok(g("I1").y < g("I3").y, "grandparents deeper than parents");
  assert.ok(g("I12").y > g("I7").y, "a child above its parent");
});

test("every limb runs between kin", () => {
  for (const tree of [hourglassTree(index, "I7"), lineTree(index, "hartwell-I1")]) {
    for (const p of tree.people) {
      const above = personAbove(tree, p.node);
      if (above === null) continue; // the trunk person, or the focal's parents off the ground point
      assert.ok(isKin(p.id, above), `${p.id} grows from ${above}`);
    }
  }
});

test("every parent-to-child pair within a line is wood: the child's limb runs down to the parent", () => {
  const kennedy = JSON.parse(readFileSync(new URL("./fixtures/kennedy/catalog.json", import.meta.url)));
  for (const cat of [catalog, kennedy]) {
    const idx = indexCatalog(cat);
    let pairs = 0;
    for (const line of cat.lines.filter((l) => l.id !== UNKNOWN_LINE && l.members.length)) {
      const tree = lineTree(idx, line.id);
      const nodeOf = new Map(tree.people.filter((p) => !p.marriedIn).map((p) => [p.id, p.node]));
      for (const child of line.members) {
        for (const parent of parentsOf(idx, child)) {
          if (idx.person.get(parent)?.line !== line.id) continue;
          pairs++;
          const below = [];
          for (let i = tree.skeleton.parents[nodeOf.get(child)]; i >= 0; i = tree.skeleton.parents[i]) below.push(i);
          assert.ok(below.includes(nodeOf.get(parent)), `${line.id}: ${child} does not grow from ${parent}`);
        }
      }
    }
    assert.ok(pairs > 0, "the fixture has parent-to-child pairs within a line");
  }
});

test("no line tree's limbs run nearly level: each child rises at least 20 degrees from its parent", () => {
  // Before the fix, a parent standing out on its ring reached children spread
  // round a wide wedge with limbs up to 33 m long, nearly flat.
  const kennedy = JSON.parse(readFileSync(new URL("./fixtures/kennedy/catalog.json", import.meta.url)));
  const idx = indexCatalog(kennedy);
  for (const line of kennedy.lines.filter((l) => l.id !== UNKNOWN_LINE && l.members.length)) {
    const tree = lineTree(idx, line.id);
    const byNode = new Map(tree.people.map((p) => [p.node, p]));
    for (const p of tree.people) {
      if (p.marriedIn) continue;
      let i = tree.skeleton.parents[p.node];
      while (i >= 0 && !byNode.has(i)) i = tree.skeleton.parents[i];
      if (i < 0) continue;
      const q = byNode.get(i);
      const rise = Math.atan2(p.y - q.y, Math.hypot(p.x - q.x, p.z - q.z));
      assert.ok(rise >= (20 * Math.PI) / 180, `${line.id}: ${q.id} to ${p.id} rises ${((rise * 180) / Math.PI).toFixed(0)} deg`);
    }
  }
});

test("every person is a member of exactly one line tree", () => {
  const membership = new Map();
  for (const line of catalog.lines.filter((l) => l.id !== UNKNOWN_LINE)) {
    for (const p of lineTree(index, line.id).people) {
      if (p.marriedIn) continue;
      membership.set(p.id, [...(membership.get(p.id) ?? []), line.id]);
      assert.equal(index.person.get(p.id).line, line.id, `${p.id} drawn as a member of ${line.id}`);
    }
  }
  for (const person of catalog.people) {
    assert.equal(membership.get(person.id)?.length, 1, `${person.id}: ${membership.get(person.id)}`);
  }
});

test("a daughter's children grow on their father's line, and married-in spouses are twigs", () => {
  const hartwell = lineTree(index, "hartwell-I1").people;
  assert.ok(!hartwell.some((p) => p.id === "I10"), "Edith Pryce is not on the Hartwell tree");
  const samuel = hartwell.find((p) => p.id === "I9");
  assert.ok(samuel?.marriedIn, "Samuel Pryce hangs at Eliza's fork");
  const pryce = lineTree(index, "pryce-I9").people;
  assert.deepEqual(pryce.filter((p) => !p.marriedIn).map((p) => p.id).sort(), ["I10", "I9"]);
  assert.ok(pryce.find((p) => p.id === "I4")?.marriedIn, "Eliza hangs at Samuel's fork");
});

test("the wood is parent-before-child, curved, and tapers by the pipe model", () => {
  const tree = hourglassTree(index, "I7");
  const { parents, radii, n } = tree.skeleton;
  assert.equal(parents[0], -1);
  for (let i = 1; i < n; i++) {
    assert.ok(parents[i] < i, `node ${i}`);
    assert.ok(radii[parents[i]] >= radii[i] - 1e-6, `node ${i} thicker than its parent`);
  }
  // One ground node plus, per placed person, the person and the curve points before it.
  assert.equal(n, 1 + tree.people.length * (EDGE_SUBDIVISIONS + 1));
});

test("generation caps bound both halves", () => {
  const ids = (t) => new Set(t.people.map((p) => p.id));
  const one = ids(hourglassTree(index, "I7", { maxAncestors: 1 }));
  assert.ok(one.has("I3") && one.has("I6") && !one.has("I1"));
  const none = ids(hourglassTree(index, "I7", { maxDescendants: 0 }));
  assert.ok(none.has("I11") && !none.has("I12"), "spouse kept, child cut");
});

test("the layout is deterministic", () => {
  const a = hourglassTree(index, "I7").skeleton.nodes;
  const b = hourglassTree(index, "I7").skeleton.nodes;
  assert.deepEqual(Array.from(a), Array.from(b));
});

test("an unknown person or line is refused", () => {
  assert.throws(() => hourglassTree(index, "nobody"), /no such person/);
  assert.throws(() => lineTree(index, "nobody-I0"), /no such line/);
});

test("the default focal person has the fullest hourglass, both halves", () => {
  const { richestFocal } = require(`${build}/familyTree.js`);
  const focal = richestFocal(index);
  const tree = hourglassTree(index, focal);
  const below = tree.people.filter((p) => p.generation < 0).length;
  const above = tree.people.filter((p) => p.generation >= 0).length - 1;
  assert.ok(below > 0 && above > 0, `${focal}: ${below} below, ${above} above`);
  // No one in the family has a fuller smaller half.
  for (const id of index.person.keys()) {
    const t = hourglassTree(index, id);
    const b = t.people.filter((p) => p.generation < 0).length;
    const a = t.people.filter((p) => p.generation >= 0).length - 1;
    assert.ok(Math.min(b, a) <= Math.min(below, above), `${id} is fuller than ${focal}`);
  }
});

test("every marriage between two lines with trees becomes a link between those trees", () => {
  globalThis.window ??= { localStorage: { getItem: () => null, setItem() {} } };
  const { getForest } = require(`${build}/forest.js`);
  const { richestFocal } = require(`${build}/familyTree.js`);
  const f = getForest(catalog, richestFocal(index));
  assert.equal(f.links.length, catalog.links.length);
  for (const link of f.links) {
    const expected = catalog.links.find((l) => l.family === link.family).lines.slice().sort();
    assert.deepEqual([f.trees[link.a].line.slug, f.trees[link.b].line.slug].sort(), expected);
  }
});

test("a line's card names its people, in order, with their years", () => {
  const { lineCard } = require(`${build}/familyForest.js`);
  const card = lineCard(index, index.line.get("hartwell-I1"));
  assert.equal(card.title, "The Hartwell line");
  assert.equal(card.members, 7);
  assert.equal(card.roster[0].id, "I1");
  assert.equal(card.roster[0].name, "John Hartwell");
  assert.match(card.roster[0].years, /^\d{4}-/);
  assert.match(card.summary, /^7 people born a Hartwell, \d{4}-\d{4}, from John Hartwell & Mary Ashcombe\.$/);
});

test("the lantern finds a line by any member's name, birthplace or year, every word", () => {
  const { lineCard } = require(`${build}/familyForest.js`);
  const { lineMatchesQuery } = require(`${build}/forest.js`);
  const hartwell = lineCard(index, index.line.get("hartwell-I1"));
  const pryce = lineCard(index, index.line.get("pryce-I9"));
  const robert = index.person.get("I7");
  assert.ok(lineMatchesQuery(hartwell, "Robert"), "a member's given name");
  assert.ok(lineMatchesQuery(hartwell, `robert ${robert.born}`), "name and year together");
  assert.ok(!lineMatchesQuery(pryce, "Robert"), "not another line's member");
  assert.ok(lineMatchesQuery(pryce, "pryce"), "the surname");
  assert.ok(!lineMatchesQuery(hartwell, "robert 1066"), "every word must match");
  assert.ok(!lineMatchesQuery(hartwell, "   "));
  const place = catalog.places.find((p) => p.id === index.person.get("I1").birth_place);
  if (place) assert.ok(lineMatchesQuery(hartwell, place.name.split(",")[0]), "a birthplace");
});
