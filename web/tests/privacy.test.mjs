// What this repo can check about privacy. The living-name scan itself runs in
// `genkg export-web`, which re-reads the GEDCOM and refuses to write a name it
// redacted; the GEDCOM is not here. This checks that every family committed as
// a fixture was exported with the filter on and is redacted, and that no
// exported family is ever tracked by git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const FIXTURES = new URL("./fixtures/", import.meta.url);
const families = readdirSync(FIXTURES).filter((d) => existsSync(new URL(`${d}/catalog.json`, FIXTURES)));

test("every committed family was exported with the living filter on", () => {
  assert.ok(families.length >= 2, `fixtures: ${families}`);
  for (const d of families) {
    const { meta } = JSON.parse(readFileSync(new URL(`${d}/catalog.json`, FIXTURES)));
    assert.equal(meta.privacy.include_living, false, `${d}: include_living`);
    assert.equal(meta.privacy.unknown_birth_policy, "redact", `${d}: unknown_birth_policy`);
    assert.ok(meta.privacy.living_cutoff_years >= 100, `${d}: cutoff ${meta.privacy.living_cutoff_years}`);
  }
});

test("a living person is a name of Living and nothing else, with no page", () => {
  let living = 0;
  for (const d of families) {
    const catalog = JSON.parse(readFileSync(new URL(`${d}/catalog.json`, FIXTURES)));
    const pages = existsSync(new URL(`${d}/people/`, FIXTURES)) ? readdirSync(new URL(`${d}/people/`, FIXTURES)) : [];
    for (const p of catalog.people.filter((x) => x.living)) {
      living++;
      assert.deepEqual(
        [p.name, p.surname, p.born, p.died, p.birth_place],
        ["Living", null, null, null, null],
        `${d}: ${p.id}`,
      );
      assert.ok(!pages.includes(`${p.id}.json`), `${d}: ${p.id} has a page`);
    }
  }
  assert.ok(living > 0, "the Kennedy fixture has living people to check");
});

test("git tracks no exported family outside the test fixtures", () => {
  const out = spawnSync("git", ["ls-files", "--", ":(top)web/public/family", ":(top)web/public/families", ":(top).demo", ":(top)*.ged", ":(top)*.pack", ":(top)*.vectors"], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), "", `tracked: ${out.stdout}`);
});
