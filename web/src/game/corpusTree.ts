// The hub tree's shape as the renderer (CorpusRedwood.tsx) draws it: bark,
// foliage sprays and the root flare. familyForest.ts builds one from the home
// hourglass; the name is the Knowledge Press's, whose hub tree was a redwood.

export type CorpusTree = {
  height: number;
  totalChunks: number;
  limbs: number;
  /** Trunk radius at the ground, above the root flare. */
  trunkRadius: number;
  /** Outer radius of the root flare: the cart cannot drive inside it. */
  baseRadius: number;
  bark: { count: number; pos: Float32Array; normal: Float32Array; uv: Float32Array; index: Uint32Array };
  /**
   * Foliage sprays: flat needle cards lying along the limbs. Position, scale
   * (x along the spray, z across it), quaternion (x, y, z, w), shade 0-7.
   */
  foliage: { count: number; pos: Float32Array; scale: Float32Array; quat: Float32Array; shade: Uint8Array };
};

/**
 * The redwood's own bark (CorpusRedwood.tsx draws it): an image twice as tall
 * as wide, one repeat 2.4 m around the trunk, so its ridges run about 30 cm
 * apart. The book trees' 0.9 m tile blurred to noise on a trunk this thick.
 */
export const REDWOOD_BARK = { aspect: 2, tile: 2.4 };
