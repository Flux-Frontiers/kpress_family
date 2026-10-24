import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D,
  OctahedronGeometry, Quaternion, RepeatWrapping, SphereGeometry, SpriteMaterial, SRGBColorSpace, Vector3, type Ray,
} from "three";
import { redwoodBark } from "./CorpusRedwood";
import { indexCatalog, type FamilyCatalog } from "./familyCatalog";
import type { Forest } from "./forest";
import { buildSchematic, pickBead, type BeadShape, type SchematicBead, type SchematicSegment } from "./schematic";
import { sim } from "./sim";
import { useGame } from "./store";

/** Bead size, m: a sphere's radius; a cube and an octahedron match it. */
const BEAD_R = 0.36;
const LIMB_R = 0.07;
const TRUNK_R = 0.16;
const BAR_R = 0.05;
const BRASS = "#b08a3e";
/** Name plates show over the beads of the tree nearest the cart, within this far, m. */
const LABEL_REACH = 30;
/** A name plate's height as a fraction of the view's: one size on screen at any distance, as GroveLabels does. */
const LABEL_SCREEN = 0.024;
const LABEL_PX = 64;

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
function SegmentMesh({ segments, radius, material, sides }: {
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

function BeadMesh({ beads, shape }: { beads: SchematicBead[]; shape: BeadShape }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => SHAPES[shape](), [shape]);
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }), []);
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

/** A name on a dark rounded plate, as a sprite material; cached by name. */
const plates = new Map<string, { material: SpriteMaterial; aspect: number }>();
function plate(name: string) {
  const hit = plates.get(name);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = `600 ${LABEL_PX * 0.56}px "Source Sans 3", ui-sans-serif, system-ui, sans-serif`;
  let width = LABEL_PX * 3;
  if (ctx) { ctx.font = font; width = Math.ceil(ctx.measureText(name).width + LABEL_PX * 0.6); }
  canvas.width = width;
  canvas.height = LABEL_PX;
  if (ctx) {
    ctx.font = font;
    ctx.fillStyle = "rgba(22, 33, 62, 0.8)";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, LABEL_PX, LABEL_PX / 2);
    ctx.fill();
    ctx.fillStyle = "#f3ead8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, width / 2, LABEL_PX / 2 + 1);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const made = { material: new SpriteMaterial({ map, sizeAttenuation: false, depthWrite: false, transparent: true, fog: false }), aspect: width / LABEL_PX };
  plates.set(name, made);
  return made;
}

/**
 * Schematic mode's orchard (schematic.ts): beads, barked limbs and brass
 * marriage bars for every tree, and name plates over the tree nearest the
 * cart. Tapping a bead is handled by the canvas through `picker`.
 */
export function SchematicOrchard({ forest, family, picker }: {
  forest: Forest; family: FamilyCatalog; picker: RefObject<((ray: Ray, maxDist: number) => SchematicBead | null) | null>;
}) {
  const schematic = useMemo(
    () => buildSchematic(indexCatalog(family), forest.trees, forest.corpusTree.focal),
    [family, forest],
  );
  const byShape = useMemo(() => {
    const out: Record<BeadShape, SchematicBead[]> = { round: [], square: [], diamond: [] };
    for (const b of schematic.beads) out[b.shape].push(b);
    return out;
  }, [schematic]);
  const barkMat = useMemo(() => {
    const m = redwoodBark();
    for (const t of [m.map, m.normalMap]) if (t) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(1, 3); }
    return m;
  }, []);
  const brassMat = useMemo(() => new MeshStandardMaterial({ color: BRASS, metalness: 0.7, roughness: 0.35 }), []);
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

  // The tree whose names show: the nearest to the cart, checked twice a second.
  const [named, setNamed] = useState<number | null>(null);
  const since = useRef(0);
  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < 0.5) return;
    since.current = 0;
    let best: number | null = null, bestD = LABEL_REACH;
    const home = Math.hypot(sim.x, sim.z);
    if (home < bestD) { best = -1; bestD = home; }
    forest.trees.forEach((t, i) => {
      const d = Math.hypot(t.x - sim.x, t.z - sim.z);
      if (d < bestD) { best = i; bestD = d; }
    });
    if (best !== named) setNamed(best);
  });
  // Not in god's eye, where the grove names (GroveLabels) say enough.
  const godEye = useGame((s) => s.preferences.camera === "god");
  const labels = useMemo(
    () => (named === null || godEye ? [] : schematic.beads.filter((b) => b.tree === named && b.name)),
    [named, schematic, godEye],
  );

  return (
    <group>
      <SegmentMesh segments={schematic.limbs} radius={limbRadius} material={barkMat} sides={8} />
      <SegmentMesh segments={schematic.bars} radius={barRadius} material={brassMat} sides={8} />
      {(["round", "square", "diamond"] as const).map((shape) => <BeadMesh key={shape} beads={byShape[shape]} shape={shape} />)}
      {labels.map((b) => {
        const p = plate(b.name);
        return (
          <sprite key={b.id + b.tree} material={p.material} position={[b.x, b.y + BEAD_R * 1.8, b.z]}
            scale={[LABEL_SCREEN * p.aspect, LABEL_SCREEN, 1]} renderOrder={10} />
        );
      })}
    </group>
  );
}
