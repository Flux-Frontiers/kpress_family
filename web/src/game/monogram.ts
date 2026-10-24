// Each grove's mark on its stop plaza is a monogram: the surname's initial in
// a script face, white on an ink disc inside a band of the grove's color. The
// letters come from one shared atlas, so the marks cost one texture however
// many groves there are; the band and disc are plain geometry.

/** The letters the atlas holds, in cell order; anything else shows the last cell. */
export const MONOGRAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?";
/** Cells per row and rows in the atlas. */
export const ATLAS_COLS = 6;
export const ATLAS_ROWS = 5;
/** The atlas canvas, px, square; a cell is ATLAS_PX / ATLAS_COLS wide. */
export const ATLAS_PX = 1024;

/** The letter a grove's mark shows: the first letter of its label, in capitals. */
export function monogramLetter(label: string): string {
  const m = /\p{L}/u.exec(label);
  const c = m ? m[0].toUpperCase() : "?";
  return MONOGRAM_LETTERS.includes(c) && c !== "?" ? c : "?";
}

/** The letter's cell in the atlas as UV bounds, v up: {u0, v0, u1, v1}. */
export function monogramCell(letter: string): { u0: number; v0: number; u1: number; v1: number } {
  let i = MONOGRAM_LETTERS.indexOf(letter);
  if (i < 0) i = MONOGRAM_LETTERS.length - 1;
  const col = i % ATLAS_COLS, row = Math.floor(i / ATLAS_COLS);
  const w = 1 / ATLAS_COLS, h = 1 / ATLAS_ROWS;
  // Canvas rows count down from the top; UV v counts up.
  return { u0: col * w, u1: (col + 1) * w, v0: 1 - (row + 1) * h, v1: 1 - row * h };
}

/** The script face the monograms are set in, with the display face behind it; loaded in styles.css. */
export const MONOGRAM_FONT = '400 150px "Pinyon Script", "Cormorant Garamond", Georgia, serif';

/**
 * Draw the atlas: every letter centered in its cell, in `ink` on a clear
 * ground. Call once the fonts are loaded (document.fonts.ready), or the
 * letters come out in the fallback face.
 */
export function drawMonogramAtlas(ctx: CanvasRenderingContext2D, ink: string): void {
  const cell = ATLAS_PX / ATLAS_COLS;
  const rowH = ATLAS_PX / ATLAS_ROWS;
  ctx.clearRect(0, 0, ATLAS_PX, ATLAS_PX);
  ctx.fillStyle = ink;
  ctx.font = MONOGRAM_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < MONOGRAM_LETTERS.length; i++) {
    const col = i % ATLAS_COLS, row = Math.floor(i / ATLAS_COLS);
    // Script capitals swash left and sit low; nudge up a little.
    ctx.fillText(MONOGRAM_LETTERS[i]!, (col + 0.5) * cell, (row + 0.5) * rowH - rowH * 0.06);
  }
}
