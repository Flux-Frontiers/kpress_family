import { useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, MeshStandardMaterial, SpriteMaterial, SRGBColorSpace } from "three";
import { indexCatalog, type FamilyCatalog } from "./familyCatalog";
import { lineTree } from "./familyTree";
import type { Forest } from "./forest";
import { gildedDescent, gildedSchematic, type GildedSegment } from "./homePath";
import type { Schematic } from "./schematic";
import { SegmentMesh } from "./SchematicOrchard";

const GOLD = "#d9b45a";

/** A soft round glow, drawn once, for the lantern's halo. */
function haloTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255, 236, 180, 0.95)");
    g.addColorStop(0.35, "rgba(255, 210, 120, 0.45)");
    g.addColorStop(1, "rgba(255, 200, 100, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/**
 * The home person on their own line's tree out on the rings: the wood from
 * the ground up to them gilded, and a lantern where they are. In the
 * schematic the gold follows its straight limbs instead of the bark.
 */
export function HomeMarks({ forest, family, schematic }: { forest: Forest; family: FamilyCatalog; schematic: Schematic | null }) {
  const marks = useMemo(() => {
    const home = forest.homeLine;
    if (!home) return null;
    const site = forest.trees[home.tree]!;
    const tree = lineTree(indexCatalog(family), site.line.slug);
    const wood = gildedDescent(tree, forest.corpusTree.focal, site.x, site.z);
    if (!wood) return null;
    const lines = schematic ? gildedSchematic(schematic, tree, forest.corpusTree.focal, site.x, site.z) : [];
    return { wood: wood.segments, lines, at: wood.at };
  }, [forest, family, schematic]);
  const gold = useMemo(() => new MeshStandardMaterial({ color: GOLD, metalness: 0.75, roughness: 0.3, emissive: GOLD, emissiveIntensity: 0.45 }), []);
  const lamp = useMemo(() => new MeshStandardMaterial({ color: "#fff1d0", emissive: "#ffd98a", emissiveIntensity: 2.2 }), []);
  const halo = useMemo(() => new SpriteMaterial({ map: haloTexture(), blending: AdditiveBlending, depthWrite: false, transparent: true, fog: false }), []);
  useEffect(() => () => { gold.dispose(); lamp.dispose(); halo.map?.dispose(); halo.dispose(); }, [gold, lamp, halo]);
  const radius = useMemo(() => (s: GildedSegment) => s.r, []);
  if (!marks) return null;
  const segments = schematic ? marks.lines : marks.wood;
  const { x, y, z } = marks.at;
  return (
    <group>
      <SegmentMesh segments={segments} radius={radius as (s: unknown) => number} material={gold} sides={10} />
      {/* The lantern: an orb in the wood view (in the schematic the bead is there), and a halo in both. */}
      {schematic ? null : (
        <mesh position={[x, y, z]} material={lamp}>
          <sphereGeometry args={[0.22, 16, 12]} />
        </mesh>
      )}
      <sprite position={[x, y, z]} material={halo} scale={[2.4, 2.4, 1]} renderOrder={9} />
    </group>
  );
}
