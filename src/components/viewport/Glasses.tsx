import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { HINGE, hingeLayout } from '@/geometry/hinge'
import { buildStandIn, disposeStandIn, FRONT_BEVEL, type StandInParts } from '@/geometry/standin'
import { DYE_HEX, templeColour, type EyewearConfig } from '@/model/config'
import { LensMaterial, NylonMaterial, SteelMaterial } from './materials'
import { usePrintedParts, type PrintedParts } from './use-printed-parts'

/**
 * How far each temple folds, as a share of the full 90°. The left temple
 * stops a little short so it rests on top of the right one instead of
 * running through it, as on real folded glasses.
 */
const FOLD_SHARE = { right: 1, left: 0.88 }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The fixed half of the hinge: its leaf in the frame pocket, the top and bottom barrels and the pivot screw head. */
function FrameHingeHalf({ config }: { config: EyewearConfig }) {
  const h = hingeLayout(config)
  const t = config.fit.frontThickness
  const [x0, x1] = h.framePocketX
  const third = HINGE.leafHeight / 3
  const r = HINGE.barrelDiameter / 2
  // The knuckle that joins the leaf (inside the frame) to the barrels (just behind it)
  const knuckleZ0 = -t + HINGE.leafThickness
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, h.y, -t + HINGE.leafThickness / 2]}>
        <boxGeometry args={[x1 - x0, HINGE.leafHeight, HINGE.leafThickness]} />
        <SteelMaterial />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[h.axisX, h.y + side * third, h.axisZ]}>
          <mesh>
            <cylinderGeometry args={[r, r, third, 20]} />
            <SteelMaterial />
          </mesh>
          <mesh position={[-r * 0.6, 0, (knuckleZ0 - h.axisZ) / 2]}>
            <boxGeometry args={[r * 1.2, third, knuckleZ0 - h.axisZ]} />
            <SteelMaterial />
          </mesh>
        </group>
      ))}
      {/* Pivot screw head on top */}
      <mesh position={[h.axisX, h.y + HINGE.leafHeight / 2 + 0.3, h.axisZ]}>
        <cylinderGeometry args={[r, r, 0.6, 20]} />
        <SteelMaterial />
      </mesh>
    </group>
  )
}

/**
 * The moving half: the temple with its hinge leaf and middle barrel, drawn
 * relative to the pivot axis so the whole group can be folded by turning it.
 */
function TempleOnPivot({
  config,
  printed,
  standIn,
}: {
  config: EyewearConfig
  printed: PrintedParts | null
  standIn: StandInParts
}) {
  const h = hingeLayout(config)
  const [u0, u1] = h.templePocketU
  const r = HINGE.barrelDiameter / 2
  const third = HINGE.leafHeight / 3
  // From the pivot to where the temple sits when open
  const dx = h.templeInnerX - h.axisX
  const dz = h.templeFrontZ - h.axisZ
  return (
    <group>
      {/* The temple lies along -Z with its inner face towards the head: its print frame turned 90° */}
      {printed ? (
        <mesh geometry={printed.temple} position={[dx, 0, dz]} rotation-y={Math.PI / 2} castShadow>
          <NylonMaterial colour={DYE_HEX[templeColour(config)]} />
        </mesh>
      ) : (
        <mesh geometry={standIn.temple} position={[dx + 0.5, 0, dz]} rotation-y={Math.PI / 2} castShadow>
          <NylonMaterial colour={DYE_HEX[templeColour(config)]} />
        </mesh>
      )}
      {/* Leaf in the temple pocket, the middle barrel, and the knuckle between them */}
      <mesh position={[dx + HINGE.leafThickness / 2, 0, dz - (u0 + u1) / 2]}>
        <boxGeometry args={[HINGE.leafThickness, HINGE.leafHeight, u1 - u0]} />
        <SteelMaterial />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r, r, third, 20]} />
        <SteelMaterial />
      </mesh>
      <mesh position={[(dx + HINGE.leafThickness) / 2, 0, -r * 0.6]}>
        <boxGeometry args={[dx + HINGE.leafThickness, third, r * 1.2]} />
        <SteelMaterial />
      </mesh>
    </group>
  )
}

/**
 * The glasses in the preview: the printed front frame and temples (built by
 * the geometry kernel, with quick stand-ins while it loads), the lenses, and
 * the standard metal hinges. `folded` swings the temples closed.
 */
export function Glasses({ config, folded }: { config: EyewearConfig; folded: boolean }) {
  const standIn = useMemo(() => buildStandIn(config), [config])
  useEffect(() => () => disposeStandIn(standIn), [standIn])
  const printed = usePrintedParts(config)

  const h = hingeLayout(config)
  const t = config.fit.frontThickness
  const frameColour = DYE_HEX[config.colour.frame]
  const frontZ = -t + FRONT_BEVEL

  // Fold animation: ease the angle towards its target, drawing frames only while it moves
  const right = useRef<Group>(null)
  const left = useRef<Group>(null)
  const angle = useRef(folded ? 1 : 0)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [folded, invalidate])
  useFrame((_, delta) => {
    const target = folded ? 1 : 0
    const next = reducedMotion() ? target : angle.current + (target - angle.current) * Math.min(1, delta * 7)
    angle.current = Math.abs(next - target) < 0.002 ? target : next
    const radians = (HINGE.foldMax * Math.PI) / 180
    if (right.current) right.current.rotation.y = angle.current * FOLD_SHARE.right * radians
    if (left.current) left.current.rotation.y = angle.current * FOLD_SHARE.left * radians
    if (angle.current !== target) invalidate()
  })

  const side = (which: 'right' | 'left') => (
    <group>
      {!printed && (
        <>
          <mesh geometry={standIn.rim} position-z={frontZ} castShadow>
            <NylonMaterial colour={frameColour} />
          </mesh>
          <mesh geometry={standIn.endPiece} position-z={frontZ} castShadow>
            <NylonMaterial colour={frameColour} />
          </mesh>
        </>
      )}
      {/* The lens sits in the middle of the frame, its edge in the groove */}
      <mesh geometry={standIn.lens} position-z={-t / 2 - 0.8} renderOrder={1}>
        <LensMaterial />
      </mesh>
      <FrameHingeHalf config={config} />
      <group ref={which === 'right' ? right : left} position={[h.axisX, h.y, h.axisZ]}>
        <TempleOnPivot config={config} printed={printed} standIn={standIn} />
      </group>
    </group>
  )

  return (
    <group>
      {side('right')}
      <group scale-x={-1}>{side('left')}</group>
      {printed ? (
        <mesh geometry={printed.front} castShadow>
          <NylonMaterial colour={frameColour} />
        </mesh>
      ) : (
        <mesh geometry={standIn.bridge} position-z={frontZ} castShadow>
          <NylonMaterial colour={frameColour} />
        </mesh>
      )}
    </group>
  )
}

