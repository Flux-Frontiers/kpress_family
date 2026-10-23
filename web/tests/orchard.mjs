// The orchard the forest tests build: the Kennedy family as `genkg
// export-web` writes it (a public corpus, built with living_cutoff_years =
// 100 and unknown births redacted), focused as the app focuses it.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export const KENNEDY = JSON.parse(readFileSync(new URL("./fixtures/kennedy/catalog.json", import.meta.url)));

/** getForest's arguments: the family and its default focal person. */
export function orchardArgs() {
  const build = process.env.FOREST_TEST_BUILD;
  const { indexCatalog } = require(`${build}/familyCatalog.js`);
  const { richestFocal } = require(`${build}/familyTree.js`);
  return [KENNEDY, richestFocal(indexCatalog(KENNEDY))];
}
