import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, BufferAttribute, BufferGeometry, DoubleSide, Group, MeshStandardMaterial } from "three";
import type { Exhibit } from "./exhibits";
import { ExhibitPlaque } from "./Signposts";
import { useGame } from "./store";
import { UplightFixtures, useUplitMaterials } from "./Uplights";
import { DNA, PLINTH_TOP, dnaHeight, dnaPairs, dnaStrand, gust, type BladeFrame, type Vec3 } from "./windRotors";

/**
 * The Double Helix exhibit: a DNA double helix spinning on a spike, faster in
 * the orchard's gusts, at the end of a spur (exhibits.ts); the geometry is in
 * windRotors.ts.
 */

/** An elliptical section swept along the frames, capped at both ends. */
function bladeGeometry(frames: BladeFrame[], chord: number, thickness: number, sides = 10): BufferGeometry {
  const pos: number[] = [];
  const index: number[] = [];
  const ring = (f: BladeFrame) => {
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const u = (Math.cos(a) * chord) / 2, v = (Math.sin(a) * thickness) / 2;
      pos.push(f.c[0] + f.chord[0] * u + f.thick[0] * v, f.c[1] + f.chord[1] * u + f.thick[1] * v, f.c[2] + f.chord[2] * u + f.thick[2] * v);
    }
  };
  frames.forEach(ring);
  for (let i = 0; i < frames.length - 1; i++) {
    for (let k = 0; k < sides; k++) {
      const a = i * sides + k, b = i * sides + ((k + 1) % sides);
      index.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  // Caps get their own vertices so the flat ends do not bend the side normals.
  for (const [f, out] of [[frames[0]!, false], [frames[frames.length - 1]!, true]] as const) {
    const base = pos.length / 3;
    ring(f);
    pos.push(...f.c);
    for (let k = 0; k < sides; k++) {
      const a = base + k, b = base + ((k + 1) % sides);
      if (out) index.push(base + sides, a, b);
      else index.push(base + sides, b, a);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * :param glow: Night floodlight strength and falloff (m) for these materials;
 *   the rotors' thin blades take the full light, a broad sculpture less.
 */
function useWindMaterials(glow: { strength: number; falloff: number } = { strength: 0.9, falloff: 9 }) {
  const m = useMemo(() => ({
    stone: new MeshStandardMaterial({ color: "#7d776c", roughness: 0.88 }),
    // Metalness stays moderate: the scene has no environment map, and a
    // fully metallic surface with nothing to reflect renders nearly black.
    steel: new MeshStandardMaterial({ color: "#5d646d", metalness: 0.5, roughness: 0.45 }),
    stainless: new MeshStandardMaterial({ color: "#e4e9ec", metalness: 0.5, roughness: 0.28 }),
    enamel: new MeshStandardMaterial({ color: "#eef0ec", metalness: 0.1, roughness: 0.35 }),
    // Copper outside, cream enamel inside each cup, so the turning tiers flash both.
    copper: new MeshStandardMaterial({ color: "#d4854a", metalness: 0.45, roughness: 0.34 }),
    cupInside: new MeshStandardMaterial({ color: "#efe6d2", roughness: 0.5, side: BackSide }),
    verdigris: new MeshStandardMaterial({ color: "#5f9e8a", metalness: 0.3, roughness: 0.6 }),
  }), []);
  useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
  // Floodlit from the plinth at night (Uplights.tsx); the whole rotor, fading toward the top.
  useUplitMaterials(useMemo(() => Object.values(m), [m]), "#ffe2b0", glow.strength, glow.falloff);
  return m;
}

/**
 * Turn each group about the shaft at its rate (rad/s, sign is direction),
 * scaled by the gust. Rotation is only ever added here, never set as a prop,
 * so a re-render does not snap a rotor back to its start.
 */
function useSpinners(x: number, rates: number[]) {
  const groups = useRef<(Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, delta) => {
    const s = useGame.getState();
    if (!s.preferences.motion || s.paused) return;
    const dt = Math.min(delta, 0.1);
    t.current += dt;
    const g = gust(t.current, x);
    rates.forEach((w, i) => {
      const grp = groups.current[i];
      if (grp) grp.rotation.y += w * g * dt;
    });
  });
  return (i: number) => (grp: Group | null) => { groups.current[i] = grp; };
}

/** Stepped plinth up to PLINTH_TOP; the cart collides with its lowest step (exhibit.obstacle). Lamps stand round its foot. */
function Plinth({ r, stone }: { r: number; stone: MeshStandardMaterial }) {
  return (
    <>
      <UplightFixtures radius={r + 0.35} count={3} pool={2.2} />
      <mesh position={[0, 0.25, 0]} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[r - 0.2, r, 0.5, 8]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.55, r * 0.62, 0.5, 8]} />
      </mesh>
    </>
  );
}

/** A vertical rod from y0 to y1. */
function Rod({ y0, y1, r, material }: { y0: number; y1: number; r: number; material: MeshStandardMaterial }) {
  return (
    <mesh position={[0, (y0 + y1) / 2, 0]} material={material} castShadow>
      <cylinderGeometry args={[r, r, y1 - y0, 10]} />
    </mesh>
  );
}

/** A red obstruction light on the mast top, blinking at night as on any tall structure. */
function Beacon({ y }: { y: number }) {
  const day = useGame((s) => s.timeOfDay === "day");
  const mat = useMemo(() => new MeshStandardMaterial({ color: "#5a1410", emissive: "#ff2a1a", emissiveIntensity: 0, roughness: 0.4 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => {
    mat.emissiveIntensity = !day && clock.elapsedTime % 1.5 < 0.25 ? 3 : 0;
  });
  return (
    <mesh position={[0, y, 0]} material={mat}>
      <sphereGeometry args={[0.1, 10, 8]} />
    </mesh>
  );
}

function useBlades(make: (b: number) => BladeFrame[], count: number, chord: number, thickness: number) {
  const blades = useMemo(() => Array.from({ length: count }, (_, b) => bladeGeometry(make(b), chord, thickness)), [make, count, chord, thickness]);
  useEffect(() => () => blades.forEach((g) => g.dispose()), [blades]);
  return blades;
}

/**
 * Night light for the pale, bright pieces (the helical rotor's stainless and
 * the DNA helix), as on the Flame of Knowledge: at full strength they
 * outshone the forest, so a weaker light that dies out a few metres up,
 * leaving their tops dim.
 */
const SOFT_GLOW = { strength: 0.3, falloff: 5 };

function Rung({ from, to, r, material }: { from: Vec3; to: Vec3; r: number; material: MeshStandardMaterial }) {
  const dx = to[0] - from[0], dz = to[2] - from[2];
  const len = Math.hypot(dx, dz);
  return (
    <group position={from} rotation={[0, Math.atan2(-dz, dx), 0]}>
      <mesh position={[len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={material}>
        <cylinderGeometry args={[r, r, len, 8]} />
      </mesh>
    </group>
  );
}

const DNA_BODY =
  "Two strands wound round each other in a right-handed helix, as in B-DNA, the form James " +
  "Watson and Francis Crick described in 1953 from Rosalind Franklin's X-ray photographs. Each " +
  "rung is a base pair, A with T and G with C, colored as in a sequencing trace. The strands are " +
  "not opposite each other, so the grooves between them alternate narrow and wide: the minor and " +
  "major grooves. There are 10.5 pairs to a turn. Read one strand from the bottom at two bits a " +
  "base, A 00, C 01, G 10, T 11, and its 36 bases spell KNOWLEDGE.";

/** Sequencing-trace colours: A green, C blue, G black, T red. */
const BASE_COLOR: Record<string, string> = { A: "#3f9b4a", C: "#3a6fb5", G: "#2b2b2e", T: "#c43d32" };

export function DnaSculpture({ exhibit }: { exhibit: Exhibit }) {
  const m = useWindMaterials(SOFT_GLOW);
  const bases = useMemo(() => Object.fromEntries(Object.entries(BASE_COLOR).map(([b, color]) =>
    [b, new MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.35 })])), []);
  useEffect(() => () => Object.values(bases).forEach((x) => x.dispose()), [bases]);
  useUplitMaterials(useMemo(() => Object.values(bases), [bases]), "#ffe2b0", SOFT_GLOW.strength, SOFT_GLOW.falloff);
  const strands = useBlades(dnaStrand as (b: number) => BladeFrame[], 2, DNA.tube * 2, DNA.tube * 2);
  const pairs = useMemo(dnaPairs, []);
  const spin = useSpinners(exhibit.x, [DNA.spin]);
  const top = DNA.y0 + dnaHeight();
  const ends = [pairs[0]!, pairs[pairs.length - 1]!];
  return (
    <group position={[exhibit.x, 0, exhibit.z]}>
      <ExhibitPlaque exhibit={exhibit} title="Double Helix" byline="After Watson, Crick and Franklin · 1953" body={DNA_BODY} />
      <Plinth r={exhibit.obstacle} stone={m.stone} />
      {/* The spike: a steel column the helix turns on, drawn to a point above it. */}
      <Rod y0={PLINTH_TOP} y1={top + 0.6} r={0.06} material={m.steel} />
      <Rod y0={PLINTH_TOP} y1={DNA.columnTop} r={0.18} material={m.steel} />
      <mesh position={[0, top + 0.95, 0]} material={m.steel}>
        <coneGeometry args={[0.06, 0.7, 10]} />
      </mesh>
      <group ref={spin(0)}>
        {strands.map((g, i) => <mesh key={i} geometry={g} material={m.stainless} castShadow />)}
        {pairs.map(({ a, b, bases: [p, q] }, i) => {
          const mid: Vec3 = [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2];
          return (
            <group key={i}>
              <Rung from={a} to={mid} r={DNA.rung} material={bases[p]!} />
              <Rung from={mid} to={b} r={DNA.rung} material={bases[q]!} />
            </group>
          );
        })}
        {/* Spokes from the spike to both strands' ends hold the helix on it. */}
        {ends.flatMap(({ a, b }, k) => [a, b].map((p, j) => (
          <Rung key={`${k}${j}`} from={[0, p[1], 0]} to={p} r={0.03} material={m.steel} />
        )))}
      </group>
      <Beacon y={top + 1.35} />
    </group>
  );
}
