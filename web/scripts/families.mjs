// Write public/families/index.json: one entry per exported family under
// public/families/<slug>/, which the app reads to offer a choice of family.
// `make family` runs it after each export.
//
//   node scripts/families.mjs

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const root = "public/families";
const families = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${root}/${d.name}/catalog.json`))
  .map((d) => {
    const catalog = JSON.parse(readFileSync(`${root}/${d.name}/catalog.json`, "utf8"));
    const about = existsSync(`${root}/${d.name}/about.json`)
      ? JSON.parse(readFileSync(`${root}/${d.name}/about.json`, "utf8"))
      : {};
    return {
      slug: d.name,
      title: about.title || d.name,
      ...(about.focal ? { focal: about.focal } : {}),
      people: catalog.people.length,
      lines: catalog.lines.filter((l) => l.id !== "unknown" && l.members.length).length,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
writeFileSync(`${root}/index.json`, `${JSON.stringify({ families }, null, 1)}\n`);
console.log(families.map((f) => `${f.slug}: ${f.title} (${f.people} people, ${f.lines} lines)`).join("\n"));
