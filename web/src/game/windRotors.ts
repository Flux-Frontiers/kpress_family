/**
 * Geometry for the Double Helix exhibit (WindSculptures.tsx): a DNA double
 * helix spinning on a spike in the wind. Plain numbers only, so the node
 * tests can check where it reaches without three.js.
 */

export type Vec3 = [number, number, number];

/** One cross-section of a blade: its centre, and unit vectors along the chord and the thickness. */
export type BladeFrame = { c: Vec3; chord: Vec3; thick: Vec3 };

/** Plinth top: every rotor's static column starts here. */
export const PLINTH_TOP = 1.0;

/**
 * Wind strength at time t for a sculpture at x: the gust term of the leaf
 * shader in Trees.tsx, so a rotor speeds up in the same gusts that shake the leaves.
 */
export function gust(t: number, x: number): number {
  return 0.65 + 0.35 * Math.sin(t * 0.35 + x * 0.02);
}

/** 2 bits to a base, high bits first: A 00, C 01, G 10, T 11. */
const BASES = "ACGT";
export function encodeBases(text: string): string {
  let out = "";
  for (const ch of text) {
    const b = ch.charCodeAt(0);
    for (let s = 6; s >= 0; s -= 2) out += BASES[(b >> s) & 3];
  }
  return out;
}
export function decodeBases(seq: string): string {
  let out = "";
  for (let i = 0; i + 4 <= seq.length; i += 4) {
    let b = 0;
    for (let k = 0; k < 4; k++) b = (b << 2) | BASES.indexOf(seq[i + k]!);
    out += String.fromCharCode(b);
  }
  return out;
}
export const PAIR: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };

/**
 * B-DNA at sculpture scale: 10.5 base pairs a turn, a pitch of 1.7 helix
 * diameters (34 A a turn on a 20 A helix), and the second strand trailing
 * the first by 12/34 of a turn, so the grooves between them alternate
 * narrow (minor, 12 A) and wide (major, 22 A). The first strand's bases,
 * read from the bottom, spell `message`.
 */
export const DNA = {
  columnTop: 2.2,
  y0: 2.6,
  radius: 0.75,
  pitch: 1.7 * 2 * 0.75,
  bpPerTurn: 10.5,
  minorGroove: 12 / 34,
  message: "KNOWLEDGE",
  /** Backbone tube and base-pair rung radii. */
  tube: 0.07,
  rung: 0.045,
  spin: 0.5,
} as const;

export const DNA_SEQUENCE = encodeBases(DNA.message);

/** Height of the helix: one rise per base pair. */
export function dnaHeight(): number {
  return (DNA_SEQUENCE.length / DNA.bpPerTurn) * DNA.pitch;
}

/** Strand s (0 or 1) at helix angle a; right-handed, so it turns z toward x as it climbs. */
function dnaPoint(s: 0 | 1, a: number): Vec3 {
  const phase = a + s * DNA.minorGroove * 2 * Math.PI;
  return [DNA.radius * Math.sin(phase), DNA.y0 + (a / (2 * Math.PI)) * DNA.pitch, DNA.radius * Math.cos(phase)];
}

/** A backbone, sampled from the first base pair to the last, with a round section. */
export function dnaStrand(s: 0 | 1, samples = 96): BladeFrame[] {
  const turns = (DNA_SEQUENCE.length - 1) / DNA.bpPerTurn;
  const out: BladeFrame[] = [];
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * turns * 2 * Math.PI;
    const c = dnaPoint(s, a);
    const phase = a + s * DNA.minorGroove * 2 * Math.PI;
    // Outward, and the section's other axis across the strand (tangent x outward).
    const out1: Vec3 = [Math.sin(phase), 0, Math.cos(phase)];
    const tx = DNA.radius * Math.cos(phase), ty = DNA.pitch / (2 * Math.PI), tz = -DNA.radius * Math.sin(phase);
    const tl = Math.hypot(tx, ty, tz);
    const across: Vec3 = [(ty * out1[2] - tz * out1[1]) / tl, (tz * out1[0] - tx * out1[2]) / tl, (tx * out1[1] - ty * out1[0]) / tl];
    out.push({ c, chord: out1, thick: across });
  }
  return out;
}

/** Each base pair: its two backbone ends and its bases, the first strand's from DNA_SEQUENCE. */
export function dnaPairs(): { a: Vec3; b: Vec3; bases: [string, string] }[] {
  return [...DNA_SEQUENCE].map((base, i) => {
    const angle = (i / DNA.bpPerTurn) * 2 * Math.PI;
    return { a: dnaPoint(0, angle), b: dnaPoint(1, angle), bases: [base, PAIR[base]!] as [string, string] };
  });
}

/** Farthest the helix's moving parts reach from the shaft, and the lowest height they reach. */
export function dnaEnvelope(): { reach: number; lowest: number } {
  return { reach: DNA.radius + DNA.tube, lowest: DNA.y0 - DNA.tube };
}
