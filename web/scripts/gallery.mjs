// Portraits of the family's line trees, rendered from the orchard itself with
// its `?shot=` mode (src/game/portrait.ts): each tree alone at midday in
// summer, every leaf drawn, framed to fit it.
//
//   npm run dev                              # in another terminal
//   npm i --no-save puppeteer-core           # drives the Chrome you have
//   node scripts/gallery.mjs [line id ...]   # or: make gallery
//
// With no line ids, every line in public/family/catalog.json that grows a
// tree. Env: FOREST_URL (default http://localhost:5173), CHROME (default the
// macOS Google Chrome), OUT (default ../renders/lines, which git ignores: the
// portraits show a family). Each tree gets its own browser: a long-lived
// headless tab has crashed on the larger orchards.

import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const base = process.env.FOREST_URL ?? "http://localhost:5173";
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = resolve(process.env.OUT ?? "../renders/lines");
const only = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const catalog = JSON.parse(readFileSync("public/family/catalog.json", "utf8"));
const lines = catalog.lines.filter((l) => l.id !== "unknown" && l.members.length).map((l) => l.id);

for (const slug of only.length ? only : lines) {
  const started = Date.now();
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    // Software WebGL, so this runs without a GPU.
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"],
    defaultViewport: { width: 1200, height: 900, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error(`${slug}: ${e.message}`));
    await page.goto(`${base}/?shot=${slug}`, { waitUntil: "domcontentloaded" });
    // Installed once the orchard has regrown with every leaf.
    await page.waitForFunction("typeof window.__shotFrame === 'function'", { timeout: 600000, polling: 500 });
    const ok = await page.evaluate((s) => window.__shot(s, window.__shotFrame([s])), slug);
    if (!ok) throw new Error(`no tree for ${slug}`);
    await page.waitForFunction("window.__shotReady === true", { timeout: 600000, polling: 500 });
    await page.screenshot({ path: `${out}/${slug}.jpg`, type: "jpeg", quality: 82 });
    console.log(`${slug}  ${((Date.now() - started) / 1000).toFixed(0)} s`);
  } finally {
    await browser.close();
  }
}
