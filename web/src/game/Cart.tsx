import { forwardRef, useLayoutEffect, useRef } from "react";
import { Color, Object3D, type Group, type InstancedMesh } from "three";
import { CART_CAPACITY, type CartBox } from "./cartLoad";

/**
 * The lantern cart: a small oak wagon, the rider's own vehicle, carrying the
 * family albums collected on the way, and the figure that stands beside each
 * tree in the line gallery for scale.
 *
 * Forward is +z. It is 1.9 m long, 1.2 m wide over the wheels and 1.5 m to
 * the top of the lantern hook; CART_SIZE states it for the gallery page.
 */
export const CART_SIZE = { length: 1.9, width: 1.2, height: 1.5 };

/** The rear wheels' radius, m: the spin rate in Player.tsx divides by it. */
export const WHEEL_R = 0.42;

const OAK = "#8a5a36";
const OAK_DARK = "#5e3b22";
const IRON = "#2b2d30";
const BRASS = "#b08a3e";

/** A spoked wheel in the yz plane, turning about x: iron tire, oak spokes, a hub. */
const Wheel = forwardRef<Group, { r: number; spokes: number; position: [number, number, number] }>(
  function Wheel({ r, spokes, position }, ref) {
    return (
      <group ref={ref} position={position}>
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[r - 0.03, 0.035, 6, 24]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
        </mesh>
        {Array.from({ length: spokes }, (_, k) => (
          <mesh key={k} rotation={[(Math.PI * k) / spokes, 0, 0]}>
            <boxGeometry args={[0.04, 2 * r - 0.08, 0.035]} />
            <meshStandardMaterial color={OAK_DARK} roughness={0.8} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
          <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    );
  },
);

type CartProps = {
  /** The lantern's glass. Lit brighter at night by the caller. */
  lanternColor?: string;
  /** Cast light from the lantern; the gallery's parked cart does without. */
  light?: boolean;
  wheelLeft?: React.Ref<Group>;
  wheelRight?: React.Ref<Group>;
  /**
   * The family albums to carry, from cartLoad. Omitted, as for the gallery's
   * parked cart, the bed is empty.
   */
  load?: readonly CartBox[];
};

const WHITE = new Color("#ffffff");
const placer = new Object3D();
const tint = new Color();

/**
 * The albums as one InstancedMesh: a unit box scaled, turned and colored per
 * instance, so every part of every album is one draw call.
 *
 * :param load: the boxes to draw, at most CART_CAPACITY.
 */
function CartCargo({ load }: { load: readonly CartBox[] }) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    // The color attribute exists only once a color is set; make it before the first draw.
    if (!m.instanceColor) m.setColorAt(0, WHITE);
    load.forEach((b, k) => {
      placer.position.set(b.x, b.y, b.z);
      // Yaw about y, then the lean about z in its own frame: the matrix cartLoad assumes.
      placer.rotation.set(0, b.yaw, b.lean, "YXZ");
      placer.scale.set(b.w, b.h, b.d);
      placer.updateMatrix();
      m.setMatrixAt(k, placer.matrix);
      m.setColorAt(k, tint.set(b.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    // Count last, so a half-written buffer is never drawn.
    m.count = load.length;
  }, [load]);

  // The bounding sphere is one unit box's, so the albums would be culled from the seat.
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CART_CAPACITY]} frustumCulled={false} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

export function Cart({ lanternColor = "#f3e6c2", light = true, wheelLeft, wheelRight, load }: CartProps) {
  return (
    <group>
      {/* Bed: planks over two iron-shod runners. */}
      {[-0.44, -0.22, 0, 0.22, 0.44].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.06, 1.8]} />
          <meshStandardMaterial color={OAK} roughness={0.85} />
        </mesh>
      ))}
      {[-0.34, 0.34].map((x) => (
        <mesh key={x} position={[x, 0.43, 0]} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.7]} />
          <meshStandardMaterial color={OAK_DARK} roughness={0.85} />
        </mesh>
      ))}

      {/* Sides: a rail on turned posts, open so the books show. */}
      {[-0.55, 0.55].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.82, 0]} castShadow>
            <boxGeometry args={[0.06, 0.07, 1.84]} />
            <meshStandardMaterial color={OAK_DARK} roughness={0.8} />
          </mesh>
          {[-0.86, -0.43, 0, 0.43, 0.86].map((z) => (
            <mesh key={z} position={[x, 0.66, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.03, 0.3, 8]} />
              <meshStandardMaterial color={OAK_DARK} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Tailboard and a low front board. */}
      <mesh position={[0, 0.66, -0.9]} castShadow>
        <boxGeometry args={[1.12, 0.26, 0.05]} />
        <meshStandardMaterial color={OAK_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0.9]} castShadow>
        <boxGeometry args={[1.12, 0.14, 0.05]} />
        <meshStandardMaterial color={OAK_DARK} roughness={0.8} />
      </mesh>

      {/* The family albums collected on the way. */}
      {load ? <CartCargo load={load} /> : null}

      {/* The lantern: an iron shepherd's hook at the front, a brass-capped lamp hanging from it. */}
      <mesh position={[-0.46, 0.98, 0.84]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.0, 8]} />
        <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.33, 1.46, 0.84]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
        <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
      </mesh>
      <group position={[-0.2, 1.24, 0.84]}>
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.11, 0.1, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
          <meshStandardMaterial color={lanternColor} emissive={lanternColor} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.1, 0.09, 0.04, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.35} />
        </mesh>
        {light ? <pointLight color="#f6e7c2" intensity={6.5} distance={18} decay={2} /> : null}
      </group>

      {/* Two tall spoked wheels carry it; two small ones steer at the front. */}
      <Wheel ref={wheelLeft} r={WHEEL_R} spokes={6} position={[-0.63, WHEEL_R, -0.3]} />
      <Wheel ref={wheelRight} r={WHEEL_R} spokes={6} position={[0.63, WHEEL_R, -0.3]} />
      <Wheel r={0.24} spokes={4} position={[-0.6, 0.24, 0.62]} />
      <Wheel r={0.24} spokes={4} position={[0.6, 0.24, 0.62]} />
    </group>
  );
}
