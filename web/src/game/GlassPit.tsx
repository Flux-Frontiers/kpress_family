import { useEffect, useMemo } from "react";
import { BackSide, CatmullRomCurve3, Color, DoubleSide, MeshStandardMaterial, TubeGeometry, Vector3 } from "three";
import type { Forest } from "./forest";
import { useGame } from "./store";

/**
 * The glass pit under the home tree. Its roots (the focal person's ancestors)
 * grow below ground, and the ground is solid and drivable, so the hub plaza is
 * glass over a lit pit: the ancestors are seen from above, and the cart drives
 * over the glass. World.tsx cuts the matching hole in the ground.
 */
export function GlassPit({ forest }: { forest: Forest }) {
  const { pitRadius: r, pitDepth: d } = forest.corpusTree;
  const glass = useMemo(
    () => new MeshStandardMaterial({ color: "#cfe6ee", transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.2, depthWrite: false, side: DoubleSide }),
    [],
  );
  useEffect(() => () => glass.dispose(), [glass]);
  return (
    <group>
      {/* The glass, just above ground so the plaza's paving meets its rim. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={glass} renderOrder={2}>
        <circleGeometry args={[r, 96]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[r - 0.12, r + 0.12, 96]} />
        <meshStandardMaterial color="#9a7b45" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* Walls and floor: dark earth, lit from within. */}
      <mesh position={[0, -d / 2, 0]}>
        <cylinderGeometry args={[r, r, d, 96, 1, true]} />
        <meshStandardMaterial color="#3a2d22" roughness={1} side={BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -d, 0]}>
        <circleGeometry args={[r, 96]} />
        <meshStandardMaterial color="#2c221a" roughness={1} />
      </mesh>
      <pointLight position={[0, -d * 0.35, 0]} intensity={18} distance={r * 3} decay={1.6} color="#ffd9a0" />
      <pointLight position={[0, -d * 0.8, 0]} intensity={8} distance={r * 2} decay={1.6} color="#ffc070" />
    </group>
  );
}

/**
 * Marriages between lines: a thin gold arc from one line's tree to the
 * other's. Drawn in the god's-eye view only: from the cart, looking up at
 * every marriage in the family at once, they read as wires across the sky.
 */
export function MarriageArcs({ forest }: { forest: Forest }) {
  const overhead = useGame((s) => s.preferences.camera === "god" && !s.flight);
  const geometries = useMemo(() => forest.links.map((link, k) => {
    const a = forest.trees[link.a]!, b = forest.trees[link.b]!;
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    const ya = a.height * 0.75, yb = b.height * 0.75;
    // A gentle rise, capped: across the orchard a tall arc reads as a wire in
    // the sky. Two marriages between the same pair of lines would coincide;
    // lift each a little more.
    const apex = Math.max(ya, yb) + Math.min(span * 0.08, 12) + (k % 3) * 1.2;
    const curve = new CatmullRomCurve3([
      new Vector3(a.x, ya, a.z),
      new Vector3((a.x + b.x) / 2, apex, (a.z + b.z) / 2),
      new Vector3(b.x, yb, b.z),
    ]);
    return new TubeGeometry(curve, Math.max(12, Math.ceil(span / 3)), 0.07, 5, false);
  }), [forest]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  const material = useMemo(
    () => new MeshStandardMaterial({ color: "#d9b25c", emissive: new Color("#d9b25c"), emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.5 }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group visible={overhead}>
      {geometries.map((g, i) => <mesh key={i} geometry={g} material={material} />)}
    </group>
  );
}
