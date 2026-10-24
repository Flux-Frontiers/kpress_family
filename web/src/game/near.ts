// Which of a set of ground points are near the cart. Textures that cost
// memory per grove (signpost faces) exist only for the points in this set,
// so what the orchard costs is bounded by how much stands near you, not by
// how big the family is. Pure, so the tests can run it; the hook below polls.

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { sim } from "./sim";

/**
 * The indices of `points` within `reach` of (x, z). A point already in
 * `prev` stays until it is past `release` (hysteresis), so a point on the
 * edge does not flicker in and out as the cart moves.
 *
 * :param release: At least `reach`.
 */
export function nearSet(
  points: readonly { x: number; z: number }[],
  x: number,
  z: number,
  reach: number,
  release: number,
  prev: ReadonlySet<number>,
): Set<number> {
  const out = new Set<number>();
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d <= reach || (prev.has(i) && d <= release)) out.add(i);
  });
  return out;
}

const sameSet = (a: ReadonlySet<number>, b: ReadonlySet<number>) => a.size === b.size && [...a].every((i) => b.has(i));

/** `nearSet` of the cart's position, polled `every` seconds; re-renders only when the set changes. */
export function useNear(points: readonly { x: number; z: number }[], reach: number, release = reach * 1.25, every = 0.5): ReadonlySet<number> {
  const [near, setNear] = useState<ReadonlySet<number>>(() => nearSet(points, sim.x, sim.z, reach, release, new Set()));
  const since = useRef(every);
  const current = useRef(near);
  useEffect(() => {
    const fresh = nearSet(points, sim.x, sim.z, reach, release, new Set());
    current.current = fresh;
    setNear(fresh);
  }, [points, reach, release]);
  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < every) return;
    since.current = 0;
    const next = nearSet(points, sim.x, sim.z, reach, release, current.current);
    if (sameSet(next, current.current)) return;
    current.current = next;
    setNear(next);
  });
  return near;
}
