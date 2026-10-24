import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, CircleGeometry, PlaneGeometry, RingGeometry, SRGBColorSpace } from "three";
import { textureAnisotropy } from "./Environment";
import { groveByGenre, type Forest } from "./forest";
import { MARK_INK, MARK_PAPER } from "./genreMarks";
import { ATLAS_PX, drawMonogramAtlas, MONOGRAM_FONT, monogramCell, monogramLetter } from "./monogram";

/** The mark's band radius on the ground, m; the stop plaza is 4 m, so 1.5 m of brick shows around it. */
const MARK_R = 2.5;
/** The ink disc inside the band, and the paper rule between them, m. */
const DISC_R = 1.9;
const RULE_R = 2.05;
/** The monogram's square, m: the letter fills most of the disc. */
const LETTER = 3.0;
/** Just above the plaza (0.055) and the grove rings (0.06). */
const MARK_Y = 0.07;

/** The one monogram atlas, drawn once the fonts are in; null until then. */
function useMonogramAtlas(): CanvasTexture | null {
  const [atlas, setAtlas] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true;
    // Ask for the script face by name: nothing on the page uses it, so
    // fonts.ready alone would not fetch it and the letters would draw in the
    // fallback serif. Offline, load() rejects and the fallback is what there is.
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const ready = fonts ? fonts.load(MONOGRAM_FONT).catch(() => []).then(() => fonts.ready) : Promise.resolve();
    ready.then(() => {
      if (!live) return;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = ATLAS_PX;
      const ctx = canvas.getContext("2d");
      if (ctx) drawMonogramAtlas(ctx, MARK_PAPER);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = textureAnisotropy(8);
      setAtlas(texture);
    });
    return () => { live = false; };
  }, []);
  useEffect(() => () => atlas?.dispose(), [atlas]);
  return atlas;
}

/** A square whose UVs are one letter's cell of the atlas. */
function letterQuad(letter: string): PlaneGeometry {
  const g = new PlaneGeometry(LETTER, LETTER);
  const { u0, v0, u1, v1 } = monogramCell(letter);
  const uv = g.attributes.uv!;
  // PlaneGeometry's corners run top-left, top-right, bottom-left, bottom-right.
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
  return g;
}

/**
 * A monogram on the stop plaza ahead of each grove, its top toward the grove,
 * so it reads the right way up to a cart pulling in to face the signpost:
 * the surname's initial in script on an ink disc, in a band of the grove's
 * color. One atlas texture serves every mark; the rest is geometry, so the
 * marks cost the same for a hundred groves as for ten.
 */
export function GroveMarks({ forest }: { forest: Forest }) {
  const atlas = useMonogramAtlas();
  const shared = useMemo(() => ({
    band: new RingGeometry(RULE_R, MARK_R, 48),
    rule: new RingGeometry(DISC_R, RULE_R, 48),
    disc: new CircleGeometry(DISC_R, 48),
  }), []);
  useEffect(() => () => { shared.band.dispose(); shared.rule.dispose(); shared.disc.dispose(); }, [shared]);
  const marks = useMemo(() => forest.circuit.map((wp) => {
    const grove = groveByGenre(forest, wp.genre);
    // The group is laid flat by a rotation about x, after a turn about its own
    // z that points the mark's top along the bearing to the grove.
    const toward = grove ? Math.atan2(grove.z - wp.z, grove.x - wp.x) : 0;
    const turn = Math.atan2(-Math.cos(toward), -Math.sin(toward));
    return { wp, color: grove?.color ?? "#888888", turn, letter: letterQuad(monogramLetter(grove?.label ?? wp.genre)) };
  }), [forest]);
  useEffect(() => () => marks.forEach((m) => m.letter.dispose()), [marks]);

  return (
    <group>
      {marks.map(({ wp, color, turn, letter }) => (
        <group key={wp.genre} rotation={[-Math.PI / 2, 0, turn]} position={[wp.x, MARK_Y, wp.z]}>
          <mesh geometry={shared.band} receiveShadow>
            <meshStandardMaterial color={color} roughness={0.85} metalness={0} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh geometry={shared.rule} receiveShadow>
            <meshStandardMaterial color={MARK_PAPER} roughness={0.85} metalness={0} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh geometry={shared.disc} receiveShadow>
            <meshStandardMaterial color={MARK_INK} roughness={0.85} metalness={0} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          {atlas ? (
            <mesh geometry={letter} position={[0, 0, 0.004]}>
              <meshStandardMaterial map={atlas} transparent roughness={0.85} metalness={0} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}
