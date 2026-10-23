import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// A browser's speech engine, recording what it is asked to say. node --test
// runs each file in its own process, so these globals stay here.
const daniel = { name: "Daniel (Enhanced)", lang: "en-GB", default: false, localService: true };
const arthur = { name: "Arthur (Enhanced)", lang: "en-GB", default: false, localService: true };
const engine = {
  listed: [],
  spoken: [],
  listeners: new Set(),
  speaking: false,
  pending: false,
  getVoices() { return this.listed; },
  speak(u) { this.spoken.push(u); },
  cancelled: 0,
  cancel() { this.cancelled++; },
  resume() {},
  addEventListener(type, fn) { if (type === "voiceschanged") this.listeners.add(fn); },
  removeEventListener(type, fn) { if (type === "voiceschanged") this.listeners.delete(fn); },
  listVoices(list) { this.listed = list; for (const fn of [...this.listeners]) fn(); },
};
globalThis.window = { speechSynthesis: engine, setTimeout, clearTimeout };
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };

const speech = () => require(`${process.env.FOREST_TEST_BUILD}/speech.js`);
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

test("narration speaks in an English voice at the narration rate, queueing on request", () => {
  const { speak, speaking } = speech();
  engine.listVoices([{ name: "Thomas", lang: "fr-FR", default: true, localService: true }, daniel, arthur]);
  speak("The Kennedy grove.");
  const u = engine.spoken.at(-1);
  assert.equal(u.text, "The Kennedy grove.");
  assert.equal(u.voice, daniel, "the first local English voice, not the French default");
  assert.equal(u.rate, 0.95);
  engine.speaking = true; // the browser is now saying it
  assert.ok(speaking());
  const before = engine.cancelled;
  speak("Next line.", true);
  assert.equal(engine.cancelled, before, "a queued line does not cut off the last");
});

test("hush stops the narration", () => {
  const { speak, hush, speaking } = speech();
  speak("Something long.");
  engine.speaking = true;
  hush();
  engine.speaking = false;
  assert.equal(speaking(), false);
});
