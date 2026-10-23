import { clamp } from "./math";
import { forwardOf } from "./sim";

/** The god's-eye camera: this much margin around the world, and pulled south by this fraction of its height so the view is not straight down. */
export const GOD_MARGIN = 1.08;
export const GOD_TILT = 0.35;
/** Zoomed all the way in, the view is about this many grove radii tall. */
const GROVE_SPAN = 3.2;
/** The field of view the god's-eye camera settles to, degrees (Player.tsx). */
export const GOD_FOV = 58;
/** The dive from god's eye to the cart, seconds. */
export const FLIGHT_S = 2.4;

/** The behind-the-cart camera: metres back and up from the cart. */
export const FOLLOW_BACK = 6.5;
export const FOLLOW_UP = 2.5;

/** Driving past a tall tree the behind-the-cart camera backs off at most this far, m; parked, up to CROWN_PARKED_MAX to fit the whole tree. It rises half as much. */
const CROWN_BACK_MAX = 8;
const CROWN_PARKED_MAX = 30;
/** Trees farther than this from the cart, m, leave the camera alone; nearer than CROWN_FULL they take it fully. */
const CROWN_REACH = 18;
const CROWN_FULL = 8;
/** At or under this speed, m/s, the cart counts as parked; at CROWN_DRIVING and over, as driving. */
const CROWN_PARKED = 1;
const CROWN_DRIVING = 4;
/** Kept between the frame's edge and what must be in it, radians. */
const FRAME_MARGIN = (4 * Math.PI) / 180;

/**
 * How the behind-the-cart camera frames a tree beside the cart: backed off,
 * raised, and tilted up toward the crown, never so far that the cart leaves
 * the bottom of the frame. Driving, it backs off a little; parked, as far as
 * it takes to show the whole tree. Nothing for a tree no taller than the
 * level view shows; it all fades in as the cart comes within reach.
 *
 * :param dist: Cart to trunk, horizontally, m.
 * :param top: Height of the tree's crown, m.
 * :param fov: The camera's vertical field of view, degrees.
 * :param speed: The cart's speed, m/s.
 * :returns: Extra metres back, extra metres up, and radians of upward tilt.
 */
export function crownFrame(dist: number, top: number, fov: number, speed = 0): { back: number; rise: number; tilt: number } {
  const w = clamp((CROWN_REACH - dist) / (CROWN_REACH - CROWN_FULL), 0, 1);
  const driving = clamp((top - 8) * 0.3, 0, CROWN_BACK_MAX);
  if (w === 0 || driving === 0) return { back: 0, rise: 0, tilt: 0 };
  const half = (fov * Math.PI) / 360;
  // From `back` metres further back: the tilt the crown top wants, and the most that keeps the cart (its bed, 0.8 m up) in frame.
  const aim = (back: number) => {
    const up = FOLLOW_UP + back / 2;
    const need = Math.atan2(top + 1 - up, dist + FOLLOW_BACK + back) - (half - FRAME_MARGIN);
    const most = half - FRAME_MARGIN - Math.atan2(up - 0.8, FOLLOW_BACK + back);
    return { need, tilt: clamp(need, 0, Math.max(0, most)) };
  };
  let parked = driving;
  while (parked < CROWN_PARKED_MAX && aim(parked).need > aim(parked).tilt) parked += 0.5;
  const still = clamp((CROWN_DRIVING - Math.abs(speed)) / (CROWN_DRIVING - CROWN_PARKED), 0, 1);
  const back = driving + still * (parked - driving);
  return { back: w * back, rise: (w * back) / 2, tilt: w * aim(back).tilt };
}

export type GroundCamera = "follow" | "high" | "cart";

export type Vec3 = { x: number; y: number; z: number };

/**
 * Where the god's-eye camera hangs: over (cx, cz) at this height, looking at
 * that point from `GOD_TILT` of the height to the south. Module state, like
 * `sim`: the camera reads it every frame and the wheel and pinch write it.
 */
export const godView = { height: 0, cx: 0, cz: 0 };

/**
 * The heights the god's-eye camera keeps between: the whole world in the
 * vertical field of view at most, about one grove at least.
 *
 * :param worldRadius: The forest's radius, m.
 * :param groveRadius: The largest grove's radius, m.
 * :param fovDeg: The camera's vertical field of view, degrees.
 */
export function godLimits(worldRadius: number, groveRadius: number, fovDeg: number): { min: number; max: number } {
  const t = Math.tan((fovDeg * Math.PI) / 360);
  const max = (worldRadius * GOD_MARGIN) / t;
  return { min: Math.min(max, (groveRadius * GROVE_SPAN) / t), max };
}

/**
 * `godLimits` for a forest, at the god's-eye field of view. A typical grove
 * sets the floor: the largest (philosophy's) is a few times the median, and
 * would stop the zoom while most groves were still small.
 */
export function forestGodLimits(forest: { worldRadius: number; groves: { radius: number }[] }): { min: number; max: number } {
  const radii = forest.groves.map((g) => g.radius).sort((a, b) => a - b);
  return godLimits(forest.worldRadius, Math.max(1, radii[radii.length >> 1] ?? 1), GOD_FOV);
}

/** Back to the whole forest, over the hub. */
export function resetGodView(max: number): void {
  godView.height = max;
  godView.cx = 0;
  godView.cz = 0;
}

/**
 * Zoom the god's-eye view by `factor` (below 1 is in) about a ground point,
 * as a map does: the point under the cursor stays under the cursor. The
 * camera's pose is a fixed shape scaled by its height, so scaling the whole
 * pose about the point keeps it on the same pixel. The height is clamped to
 * the limits, and the centre to the part of the world a view that low can
 * show without running off the edge.
 *
 * :param ax: The ground point's x, m.
 * :param az: The ground point's z, m.
 * :param factor: New height over old.
 * :param limits: From `godLimits`.
 * :param worldRadius: The forest's radius, m.
 */
export function zoomGodView(ax: number, az: number, factor: number, limits: { min: number; max: number }, worldRadius: number): void {
  const height = clamp(godView.height * factor, limits.min, limits.max);
  const s = height / (godView.height || height);
  let cx = ax + (godView.cx - ax) * s;
  let cz = az + (godView.cz - az) * s;
  const span = limits.max - limits.min;
  const reach = span > 0 ? worldRadius * (1 - (height - limits.min) / span) : 0;
  const d = Math.hypot(cx, cz);
  if (d > reach) {
    cx *= reach / d;
    cz *= reach / d;
  }
  godView.height = height;
  godView.cx = cx;
  godView.cz = cz;
}

/** The god's-eye camera position and look point for the current view. */
export function godPose(): { cam: Vec3; look: Vec3 } {
  const { height, cx, cz } = godView;
  return { cam: { x: cx, y: height, z: cz + height * GOD_TILT }, look: { x: cx, y: 0, z: cz } };
}

/**
 * Where a ground camera sits for a cart at (x, y, z) heading `yaw`, looking
 * straight ahead: the same poses Player.tsx chases, before any pan or tilt.
 */
export function groundPose(mode: GroundCamera, x: number, y: number, z: number, yaw: number): { cam: Vec3; look: Vec3 } {
  const v = forwardOf(yaw);
  if (mode === "cart") {
    return { cam: { x: x - v.x * 0.45, y: y + 1.65, z: z - v.z * 0.45 }, look: { x: x + v.x * 10, y: y + 1.65, z: z + v.z * 10 } };
  }
  const high = mode === "high";
  const back = high ? 12 : FOLLOW_BACK;
  const up = high ? 10 : FOLLOW_UP;
  const ahead = high ? 2.6 : 10;
  return {
    cam: { x: x - v.x * back, y: y + up, z: z - v.z * back },
    look: { x: x + v.x * ahead, y: y + (high ? 1.4 : FOLLOW_UP), z: z + v.z * ahead },
  };
}

/** Smoothstep's quintic cousin: still at both ends, so the dive leaves and lands gently. */
function ease(t: number): number {
  const u = clamp(t, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/**
 * The camera `elapsed` seconds into a dive from `from` to `to`. `to` is
 * re-read every frame, so a cart that moves during the dive is still where
 * it lands.
 *
 * :return: The pose, and `done` once the dive has landed on `to`.
 */
export function flightPose(
  from: { cam: Vec3; look: Vec3 },
  to: { cam: Vec3; look: Vec3 },
  elapsed: number,
): { cam: Vec3; look: Vec3; done: boolean } {
  // Landed is exactly the chase pose, not a float's width off it.
  if (elapsed >= FLIGHT_S) return { cam: { ...to.cam }, look: { ...to.look }, done: true };
  const t = ease(elapsed / FLIGHT_S);
  return { cam: mix(from.cam, to.cam, t), look: mix(from.look, to.look, t), done: false };
}
