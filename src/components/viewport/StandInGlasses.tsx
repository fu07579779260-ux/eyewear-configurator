import { useEffect, useMemo } from 'react'
import {
  buildStandIn,
  disposeStandIn,
  FRONT_BEVEL,
  standInLayout,
  TEMPLE_THICKNESS,
  type StandInParts,
} from '@/geometry/standin'
import { DYE_HEX, templeColour, type EyewearConfig } from '@/model/config'
import { LensMaterial, NylonMaterial, SteelMaterial } from './materials'
import { useFrontFrame } from './use-front-frame'

/**
 * One side's lens, hinge and temple (the right side; the left is the same,
 * mirrored). Until the printable front is ready, also its quick stand-in rim
 * and end piece.
 */
function Side({ config, parts, standInFront }: { config: EyewearConfig; parts: StandInParts; standInFront: boolean }) {
  const { frontThickness, templeWidth } = config.fit
  const l = standInLayout(config)
  const frame = DYE_HEX[config.colour.frame]
  const temple = DYE_HEX[templeColour(config)]
  // Stand-in extrusions start at their bevel, so shift them to sit in Z = -frontThickness … 0
  const frontZ = -frontThickness + FRONT_BEVEL
  const behind = -frontThickness - 0.4

  return (
    <group>
      {standInFront && (
        <>
          <mesh geometry={parts.rim} position-z={frontZ} castShadow>
            <NylonMaterial colour={frame} />
          </mesh>
          <mesh geometry={parts.endPiece} position-z={frontZ} castShadow>
            <NylonMaterial colour={frame} />
          </mesh>
        </>
      )}
      {/* The lens sits in the middle of the frame, its edge in the groove */}
      <mesh geometry={parts.lens} position-z={-frontThickness / 2 - 0.8} renderOrder={1}>
        <LensMaterial />
      </mesh>

      {/* Hinge block with its screw head, just behind the end piece (placeholder until step 7) */}
      <group position={[l.hingeX - 2.2, l.hingeY, behind - 2.5]}>
        <mesh castShadow>
          <boxGeometry args={[2.6, templeWidth * 0.62, 6]} />
          <SteelMaterial />
        </mesh>
        <mesh position-y={templeWidth * 0.31 + 0.3}>
          <cylinderGeometry args={[0.9, 0.9, 0.6, 16]} />
          <SteelMaterial />
        </mesh>
      </group>

      {/* Temple, opened to 90°: its length runs back along -Z, its thickness along X (placeholder until step 7) */}
      <mesh
        geometry={parts.temple}
        position={[l.hingeX - TEMPLE_THICKNESS + 0.5, l.hingeY, behind]}
        rotation-y={Math.PI / 2}
        castShadow
      >
        <NylonMaterial colour={temple} />
      </mesh>
    </group>
  )
}

/**
 * The glasses in the preview: the printable front frame (built by the
 * geometry kernel), the lenses, and stand-in hinges and temples until build
 * step 7.
 */
export function StandInGlasses({ config }: { config: EyewearConfig }) {
  const parts = useMemo(() => buildStandIn(config), [config])
  useEffect(() => () => disposeStandIn(parts), [parts])
  const front = useFrontFrame(config)
  const frameColour = DYE_HEX[config.colour.frame]

  return (
    <group>
      <Side config={config} parts={parts} standInFront={!front} />
      <group scale-x={-1}>
        <Side config={config} parts={parts} standInFront={!front} />
      </group>
      {front ? (
        <mesh geometry={front} castShadow>
          <NylonMaterial colour={frameColour} />
        </mesh>
      ) : (
        <mesh geometry={parts.bridge} position-z={-config.fit.frontThickness + FRONT_BEVEL} castShadow>
          <NylonMaterial colour={frameColour} />
        </mesh>
      )}
    </group>
  )
}
