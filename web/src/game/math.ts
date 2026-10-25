/** Deterministic hash (FNV-1a) — same slug always grows the same tree. */
export function seedFromKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * n points spread evenly (equal area each) over an annulus from `inner`, about
 * `spacing` apart: a sunflower (Vogel) spiral, r = sqrt(inner^2 + c^2 i).
 * Returns the points and the outer radius they reach.
 */
export function sunflower(n: number, inner: number, spacing: number): { pts: { x: number; z: number }[]; outer: number } {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const c2 = (spacing * spacing) / Math.PI;
  const pts: { x: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(inner * inner + c2 * (i + 0.5));
    pts.push({ x: r * Math.cos(i * golden), z: r * Math.sin(i * golden) });
  }
  return { pts, outer: Math.sqrt(inner * inner + c2 * n) };
}

/**
 * Seat groves on concentric ring roads around a hub, in the order given,
 * and choose the spokes.
 *
 * Each tier's groves sit just outside its ring at `setback`, their edges at
 * least `gap` apart, spaced evenly; the ring is the least radius that fits
 * them. One or two tiers, whichever gives the smaller world. The first spoke
 * (the tour's) runs through the gap before the first grove, and each outer
 * tier is turned so a counterclockwise lap of every ring from that spoke
 * meets the groves in order. The spokes are reserved as the inner tier is
 * seated: `spokes` lanes, spread evenly through its sequence of groves, each
 * seated like a grove of its own with no width, so a spoke always has a gap
 * of its own and the spokes come out as even as the groves allow.
 *
 * :param radii: Grove radii, in the order the groves are to be met.
 * :param opts: `hub`, the least radius of the first ring; `setback`, ring road
 *   to grove edge; `gap`, least clear distance between two groves; `lane`,
 *   least clear distance from a spoke's centreline to a grove edge; `spokes`,
 *   how many spokes, at most one per inner-tier grove.
 * :returns: Each grove's centre and tier, each tier's ring radius, the spoke
 *   bearings (radians), and the world radius (the outermost grove edge).
 */
export function wheelLayout(
  radii: number[],
  opts: { hub: number; setback: number; gap: number; lane: number; spokes: number },
): { centers: { x: number; z: number }[]; tier: number[]; rings: number[]; spokes: number[]; outer: number } {
  const { hub, setback, gap, lane } = opts;
  radii.forEach((r, i) => {
    if (!Number.isFinite(r) || r <= 0) throw new Error(`wheelLayout: radius ${i} is ${r}`);
  });
  const n = radii.length;
  // A spoke lane is seated as a phantom grove (index -1) whose edge the
  // neighbours keep `gap` from, so the lane clears them by `gap`; wider only
  // if `lane` asks for more.
  const LANE = -1;
  const laneR = Math.max(0, lane - gap);
  const rad = (g: number) => (g === LANE ? laneR : radii[g]!);
  // Angle between neighbours whose inner edges both sit `setback` outside ring R.
  const sep = (R: number, a: number, b: number) => {
    const ca = R + setback + a, cb = R + setback + b, d = a + b + gap;
    return Math.acos(clamp((ca * ca + cb * cb - d * d) / (2 * ca * cb), -1, 1));
  };
  const place = (order: number[], R: number): number[] | null => {
    const k = order.length;
    if (k === 1) return [0];
    const gaps = order.map((g, i) => sep(R, rad(g), rad(order[(i + 1) % k]!)));
    const slack = 2 * Math.PI - gaps.reduce((a, b) => a + b, 0);
    if (slack < 0) return null;
    const ang: number[] = [0];
    for (let i = 1; i < k; i++) ang.push(ang[i - 1]! + gaps[i - 1]! + slack / k);
    const at = (i: number) => {
      const c = R + setback + rad(order[i]!);
      return { x: c * Math.cos(ang[i]!), z: c * Math.sin(ang[i]!) };
    };
    // Neighbours are spaced by construction; check every other pair too.
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const a = at(i), b = at(j);
      if (Math.hypot(a.x - b.x, a.z - b.z) < rad(order[i]!) + rad(order[j]!) + gap - 1e-6) return null;
    }
    return ang;
  };
  // The least ring radius, at or above `least`, that fits the tier.
  const fit = (order: number[], least: number) => {
    let lo = least, hi = least;
    while (!place(order, hi)) hi = hi * 2 + 1;
    if (hi === least) return least;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      if (place(order, mid)) hi = mid; else lo = mid;
    }
    return hi;
  };
  // The inner tier's sequence with its lanes: one before the first grove
  // (the tour's), the rest before whichever grove stands nearest each of the
  // other evenly spread bearings, judged by seating the tier once without
  // lanes, so the spokes come out even by angle, not by count of groves.
  const withLanes = (groves: number[]): number[] => {
    const k = Math.min(opts.spokes, groves.length);
    const bare = place(groves, fit(groves, hub))!;
    const before = new Set<number>([0]);
    for (let j = 1; j < k; j++) {
      const target = (2 * Math.PI * j) / k;
      let pick = 0, d = Infinity;
      bare.forEach((a, i) => {
        const e = Math.abs(a - target);
        if (!before.has(i) && e < d) { d = e; pick = i; }
      });
      before.add(pick);
    }
    return groves.flatMap((g, i) => (before.has(i) ? [LANE, g] : [g]));
  };
  const all = [...radii.keys()];
  let best: { tiers: number[][]; rings: number[]; outer: number } | null = null;
  // The first k groves in the inner tier; k = 0 is a single ring.
  for (let k = 0; k < n; k++) {
    const tiers = k ? [withLanes(all.slice(0, k)), all.slice(k)] : [withLanes(all)];
    const rings: number[] = [];
    let least = hub;
    for (const t of tiers) {
      const R = fit(t, least);
      rings.push(R);
      least = R + setback + 2 * Math.max(...t.map(rad)) + setback;
    }
    const last = tiers[tiers.length - 1]!;
    const outer = rings[rings.length - 1]! + setback + 2 * Math.max(...last.map(rad));
    if (!best || outer < best.outer - 1e-6) best = { tiers, rings, outer };
  }
  const { tiers, rings, outer } = best!;
  const centers: { x: number; z: number }[] = new Array(n);
  const tier: number[] = new Array(n);
  const angles: number[][] = tiers.map((order, t) => place(order, rings[t]!)!);
  const seat = (t: number) => tiers[t]!.forEach((g, i) => {
    if (g === LANE) return;
    const c = rings[t]! + setback + radii[g]!;
    centers[g] = { x: c * Math.cos(angles[t]![i]!), z: c * Math.sin(angles[t]![i]!) };
    tier[g] = t;
  });
  seat(0);
  // The spokes are the inner tier's lanes; the first is the tour's. Each
  // outer tier is turned so its own gap between last and first grove
  // straddles that spoke, and its lap is in order too.
  const spokes = tiers[0]!.flatMap((g, i) => (g === LANE ? [angles[0]![i]!] : []))
    .map((a) => Math.atan2(Math.sin(a), Math.cos(a)));
  const tourA = spokes[0]!;
  for (let t = 1; t < tiers.length; t++) {
    const ang = angles[t]!;
    const turn = tourA - (ang[ang.length - 1]! + 2 * Math.PI) / 2;
    angles[t] = ang.map((a) => a + turn);
    seat(t);
  }
  return { centers, tier, rings, spokes, outer };
}

export function fibonacciAnnulus(
  n: number,
  inner: number,
  outer: number,
): { x: number; z: number }[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts: { x: number; z: number }[] = [];
  const count = Math.max(n, 1);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const r = inner + t * (outer - inner);
    const a = i * golden;
    pts.push({ x: r * Math.cos(a), z: r * Math.sin(a) });
  }
  return pts;
}

export function fibonacciHemisphere(n: number, radius: number): { x: number; y: number; z: number }[] {
  const pts: { x: number; y: number; z: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const need = Math.max(n, 1);
  let i = 0;
  let found = 0;
  const cap = need * 3 + 8;
  while (found < need && i < cap) {
    const y = 1 - (i / Math.max(cap - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * golden;
    const yy = Math.abs(y);
    pts.push({ x: Math.cos(a) * r * radius, y: yy * radius, z: Math.sin(a) * r * radius });
    found++;
    i++;
  }
  return pts.slice(0, need);
}
