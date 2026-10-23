/// <reference lib="webworker" />
// Builds the orchard off the main thread, from the family the page loaded.
import type { FamilyCatalog } from "./familyCatalog";
import { getForest } from "./forest";

self.onmessage = (e: MessageEvent<{ id: number; leafScale: number; family: FamilyCatalog; focal: string }>) => {
  const forest = getForest(e.data.family, e.data.focal, e.data.leafScale);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id: e.data.id, forest });
};
