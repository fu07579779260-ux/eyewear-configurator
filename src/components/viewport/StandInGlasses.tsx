import { useEffect, useMemo } from 'react'
import { buildStandIn, disposeStandIn, standInLayout, TEMPLE_THICKNESS, type StandInParts } from '@/geometry/standin'
import { DYE_HEX, templeColour, type EyewearConfig } from '@/model/config'
import { LensMaterial, NylonMaterial, SteelMaterial } from './materials'

const BEVEL = 0.6

/** One side of the glasses (the right side; the left is the same, mirrored). */
function Side({ config, parts }: { config: EyewearConfig; parts: StandInParts }) {
  const { frontThickness, templeWidth } = config.fit
  const l = standInLayout(config)
  const frame = DYE_HEX[config.colour.frame]
  const temple = DYE_HEX[templeColour(config)]
  // Extrusions start at their bevel, so shift them to sit in Z = -frontThickness … 0
  const frontZ = -frontThickness + BEVEL
  const behind = -frontThickness - 0.4

  return (
    <group>
      <mesh geometry={parts.rim} position-z={frontZ} castShadow>
        <NylonMaterial colour={frame} />
      </mesh>
      <mesh geometry={parts.endPiece} position-z={frontZ} castShadow>
        <NylonMaterial colour={frame} />
      </mesh>
      <mesh geometry={parts.lens} position-z={-frontThickness / 2 - 0.8} renderOrder={1}>
        <LensMaterial />
      </mesh>

      {/* Hinge block with its screw head, just behind the end piece */}
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

      {/* Temple, opened to 90°: its length runs back along -Z, its thickness along X */}
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

/** Stand-in glasses for checking the viewport; replaced by the real parts in build steps 5–7. */
export function StandInGlasses({ config }: { config: EyewearConfig }) {
  const parts = useMemo(() => buildStandIn(config), [config])
  useEffect(() => () => disposeStandIn(parts), [parts])

  return (
    <group>
      <Side config={config} parts={parts} />
      <group scale-x={-1}>
        <Side config={config} parts={parts} />
      </group>
      <mesh geometry={parts.bridge} position-z={-config.fit.frontThickness + BEVEL} castShadow>
        <NylonMaterial colour={DYE_HEX[config.colour.frame]} />
      </mesh>
    </group>
  )
}
