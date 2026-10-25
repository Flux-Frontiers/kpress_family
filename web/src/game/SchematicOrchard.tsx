import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import {
  BoxGeometry, Color, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D,
  OctahedronGeometry, Quaternion, RepeatWrapping, SphereGeometry, Vector3, type Ray,
} from "three";
import { redwoodBark } from "./CorpusRedwood";
import { pickBead, type BeadShape, type Schematic, type SchematicBead, type SchematicSegment } from "./schematic";

/** Bead size, m: a sphere's radius; a cube and an octahedron match it. */
const BEAD_R = 0.36;
const LIMB_R = 0.07;
const TRUNK_R = 0.16;
const BAR_R = 0.05;
const BRASS = "#b08a3e";

const up = new Vector3(0, 1, 0);
const o = new Object3D();
const dirV = new Vector3();
const tint = new Color();

/** A unit cylinder along y, from y = 0 to y = 1, so a segment is a scale and a turn. */
function unitCylinder(sides: number) {
  return new CylinderGeometry(1, 1, 1, sides, 1).translate(0, 0.5, 0);
}

function placeSegment(s: SchematicSegment, r: number): boolean {
  dirV.set(s.bx - s.ax, s.by - s.ay, s.bz - s.az);
  const len = dirV.length();
  if (len < 1e-6) return false;
  o.position.set(s.ax, s.ay, s.az);
  o.quaternion.copy(new Quaternion().setFromUnitVectors(up, dirV.divideScalar(len)));
  o.scale.set(r, len, r);
  o.updateMatrix();
  return true;
}

/** Segments as one InstancedMesh of cylinders. */
export function SegmentMesh({ segments, radius, material, sides }: {
  segments: SchematicSegment[]; radius: (s: SchematicSegment) => number; material: MeshStandardMaterial; sides: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => unitCylinder(sides), [sides]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let k = 0;
    for (const s of segments) {
      if (!placeSegment(s, radius(s))) continue;
      mesh.setMatrixAt(k++, o.matrix);
    }
    mesh.count = k;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [segments, radius]);
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, segments.length)]} castShadow receiveShadow />;
}

const SHAPES: Record<BeadShape, () => SphereGeometry | BoxGeometry | OctahedronGeometry> = {
  round: () => new SphereGeometry(BEAD_R, 16, 12),
  square: () => new BoxGeometry(BEAD_R * 1.6, BEAD_R * 1.6, BEAD_R * 1.6),
  diamond: () => new OctahedronGeometry(BEAD_R * 1.25),
};

/** Each bead glows faintly in its own color (the instance color), so the diagram reads at dusk and by night. */
const BEAD_GLOW = 0.35;

/**
 * A standard material that also emits its instance color, scaled by `amount`:
 * three's emissive is one color for the whole mesh, so it is patched in.
 */
function glowing(m: MeshStandardMaterial, amount: number): MeshStandardMaterial {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance += vColor.rgb * ${amount.toFixed(2)};\n#endif`,
    );
  };
  m.customProgramCacheKey = () => `schematic-bead-glow-${amount}`;
  return m;
}

function BeadMesh({ beads, shape }: { beads: SchematicBead[]; shape: BeadShape }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => SHAPES[shape](), [shape]);
  const material = useMemo(() => glowing(new MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }), BEAD_GLOW), []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    beads.forEach((b, k) => {
      o.position.set(b.x, b.y, b.z);
      o.quaternion.identity();
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      mesh.setMatrixAt(k, o.matrix);
      mesh.setColorAt(k, tint.set(b.color));
    });
    mesh.count = beads.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [beads]);
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, beads.length)]} castShadow />;
}

/**
 * Schematic mode's orchard (schematic.ts): beads, barked limbs and brass
 * marriage bars for every tree. The name plates are NamePlates, shared with
 * the wood view. Tapping a bead is handled by the canvas through `picker`.
 */
export function SchematicOrchard({ schematic, picker }: {
  schematic: Schematic; picker: RefObject<((ray: Ray, maxDist: number) => SchematicBead | null) | null>;
}) {
  const byShape = useMemo(() => {
    const out: Record<BeadShape, SchematicBead[]> = { round: [], square: [], diamond: [] };
    for (const b of schematic.beads) out[b.shape].push(b);
    return out;
  }, [schematic]);
  const barkMat = useMemo(() => {
    const m = redwoodBark();
    for (const t of [m.map, m.normalMap]) if (t) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(1, 3); }
    // A little warmth of its own, so the wood does not go black at night.
    m.emissive.set("#3a2416");
    m.emissiveIntensity = 0.6;
    return m;
  }, []);
  const brassMat = useMemo(() => new MeshStandardMaterial({ color: BRASS, metalness: 0.7, roughness: 0.35, emissive: BRASS, emissiveIntensity: 0.25 }), []);
  useEffect(() => () => {
    barkMat.map?.dispose();
    barkMat.normalMap?.dispose();
    barkMat.dispose();
    brassMat.dispose();
  }, [barkMat, brassMat]);
  // A trunk is the segment from the ground; it is drawn thicker.
  const limbRadius = useMemo(() => (s: SchematicSegment) => (s.ay === 0 ? TRUNK_R : LIMB_R), []);
  const barRadius = useMemo(() => () => BAR_R, []);

  useEffect(() => {
    picker.current = (ray, maxDist) => pickBead(schematic.beads, ray.origin, ray.direction, BEAD_R * 1.6, maxDist);
    return () => { picker.current = null; };
  }, [schematic, picker]);

  return (
    <group>
      <SegmentMesh segments={schematic.limbs} radius={limbRadius} material={barkMat} sides={8} />
      <SegmentMesh segments={schematic.bars} radius={barRadius} material={brassMat} sides={8} />
      {(["round", "square", "diamond"] as const).map((shape) => <BeadMesh key={shape} beads={byShape[shape]} shape={shape} />)}
    </group>
  );
}
