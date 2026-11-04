import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { FoldHorizontal, RotateCcw, UnfoldHorizontal } from 'lucide-react'
import { useCallback, useLayoutEffect, useState } from 'react'
import type { Group, Mesh } from 'three'
import { standInLayout } from '@/geometry/standin'
import { useT } from '@/i18n/language'
import { cn } from '@/lib/utils'
import { useDesign } from '@/model/design-context'
import { CaptureRegistrar } from './CaptureRegistrar'
import { Glasses } from './Glasses'

// Scene units are millimetres, Y up, Y = 0 at the lens centres, the front of
// the frame facing +Z. Lit like a calm photo studio: a warm paper backdrop,
// a large soft window to the upper left, a warm fill from the right and a
// soft contact shadow on the table. No HDR file is downloaded (the site must
// also work in mainland China), so reflections come from panels in the scene.

const BACKDROP = '#ece3d6'
const DAYLIGHT = '#fff6ea'
const WARM_FILL = '#ffe3c2'

/** A raised three-quarter front view; the distance scales with the frame width. */
const DIRECTION = (() => {
  const v = [0.62, 0.38, 1]
  const len = Math.hypot(...v)
  return v.map((c) => c / len) as [number, number, number]
})()
const DISTANCE_PER_MM = 2.1
const FOV = 30
/** Share of the frame width that must fit across a narrow (phone) preview. */
const WIDTH_TO_FIT = 0.95

/**
 * Camera distance that shows the whole pair: far enough for the height on
 * wide previews, and for the width on narrow ones such as phones.
 */
function homeDistance(frameWidth: number, aspect: number): number {
  const byHeight = frameWidth * DISTANCE_PER_MM
  const byWidth = (frameWidth * WIDTH_TO_FIT) / (Math.tan(((FOV / 2) * Math.PI) / 180) * aspect)
  return Math.max(byHeight, byWidth)
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Moves the camera to the home view whenever `homeKey` or the preview's shape changes. */
function CameraHome({ homeKey, frameWidth, target }: { homeKey: string; frameWidth: number; target: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))
  // Rounded so that small resizes (a scrollbar appearing) don't move the camera
  const aspectStep = Math.round(aspect * 10) / 10
  useLayoutEffect(() => {
    const distance = homeDistance(frameWidth, aspectStep)
    const [x, y, z] = DIRECTION
    camera.position.set(target[0] + x * distance, target[1] + y * distance, target[2] + z * distance)
    camera.lookAt(...target)
    invalidate()
    // Only re-home on a reset, a big size change or a new preview shape, not on every small edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeKey, aspectStep, camera, invalidate])
  return null
}

/**
 * drei's ContactShadows (10.7 with three 0.186) shows its shadow mirrored
 * front to back. Round objects hide this, but under glasses the temple shadows
 * land in front of the frame. Flipping the shadow plane puts them back under
 * the temples (checked in the browser).
 */
function useUnmirroredShadow() {
  return useCallback((group: Group | null) => {
    const plane = group?.children.find((c): c is Mesh => (c as Mesh).isMesh)
    if (plane) plane.scale.z = -1
  }, [])
}

/** Development only: lets the browser console inspect the scene and camera. */
function DebugHandle() {
  const state = useThree()
  useLayoutEffect(() => {
    ;(window as unknown as { __eyewear3d?: unknown }).__eyewear3d = state
  }, [state])
  return null
}

function StudioLight() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#d9cdbd']} />
      {/* The window: large and soft, upper left */}
      <Lightformer form="rect" intensity={2.6} color={DAYLIGHT} position={[-4, 4, 3]} scale={[7, 5, 1]} target={[0, 0, 0]} />
      {/* Warm bounce from the right and from the table */}
      <Lightformer form="rect" intensity={1.1} color={WARM_FILL} position={[5, 1, 2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.6} color="#f3e6d3" position={[0, -4, 1]} scale={[10, 3, 1]} target={[0, 0, 0]} />
      {/* A thin strip behind for a soft edge highlight on the temples and hinges */}
      <Lightformer form="rect" intensity={1.4} color={DAYLIGHT} position={[0, 3, -6]} scale={[8, 0.6, 1]} target={[0, 0, 0]} />
    </Environment>
  )
}

export default function Viewport() {
  const t = useT()
  const { config } = useDesign()
  const [resets, setResets] = useState(0)
  const [folded, setFolded] = useState(false)
  const shadowRef = useUnmirroredShadow()

  const l = standInLayout(config)
  const { frameWidth, templeLength } = config.fit
  // Look at the middle of the glasses, a little behind the front so the temples are in view
  const target: [number, number, number] = [0, 0, -templeLength * 0.32]
  // The farthest home view (a square or narrower preview) sets the fog
  const distance = homeDistance(frameWidth, 1)
  // Re-home after a reset, or when the size changes by more than a few millimetres
  const homeKey = `${resets}:${Math.round(frameWidth / 5)}:${Math.round(templeLength / 10)}`

  return (
    <div className="relative h-full overflow-hidden rounded-2xl">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        shadows={false}
        camera={{ fov: FOV, near: 1, far: 5000, position: [0, 0, distance] }}
        fallback={<p className="p-4 text-sm text-muted">{t('viewport.noWebgl')}</p>}
        aria-label={t('viewport.canvas')}
        role="img"
      >
        <color attach="background" args={[BACKDROP]} />
        <fog attach="fog" args={[BACKDROP, distance * 1.5, distance * 3.5]} />
        <hemisphereLight args={['#fff8ef', '#cdbba3', 0.35]} />
        {/* Key light from the window side */}
        <directionalLight position={[-frameWidth, frameWidth * 1.2, frameWidth]} intensity={2.3} color={DAYLIGHT} />
        <directionalLight position={[frameWidth, frameWidth * 0.3, frameWidth * 0.6]} intensity={0.45} color={WARM_FILL} />
        <StudioLight />

        <Glasses config={config} folded={folded} />

        {/* Redrawn with every frame, so the shadow follows the temples as they fold and the printed parts as they arrive */}
        <ContactShadows
          ref={shadowRef}
          position={[0, l.bottomY - 0.3, target[2]]}
          scale={Math.max(frameWidth, templeLength) * 2.2}
          far={l.lensHeight}
          blur={2}
          opacity={0.6}
          color="#5b4a39"
          resolution={512}
          key={`shadow:${homeKey}:${l.bottomY.toFixed(1)}`}
        />

        <CameraHome homeKey={homeKey} frameWidth={frameWidth} target={target} />
        <CaptureRegistrar fitWidth={frameWidth} />
        {import.meta.env.DEV && <DebugHandle />}
        <OrbitControls
          key={homeKey}
          makeDefault
          enableDamping={!reducedMotion()}
          enablePan={false}
          target={target}
          minDistance={frameWidth * 0.9}
          maxDistance={frameWidth * 5}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 + 0.02}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <p className="text-xs text-muted">{t('viewport.hint')}</p>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            aria-pressed={folded}
            onClick={() => setFolded((f) => !f)}
            className={cn(
              'pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors',
              folded
                ? 'bg-sage text-primary-foreground ring-sage'
                : 'bg-surface/90 text-ink ring-rule hover:bg-surface',
            )}
          >
            {folded ? (
              <UnfoldHorizontal className="size-3.5" aria-hidden="true" />
            ) : (
              <FoldHorizontal className="size-3.5" aria-hidden="true" />
            )}
            {t('viewport.fold')}
          </button>
          <button
            type="button"
            onClick={() => setResets((n) => n + 1)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-rule hover:bg-surface"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('viewport.reset')}
          </button>
        </div>
      </div>
    </div>
  )
}
