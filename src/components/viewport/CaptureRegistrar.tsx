import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PerspectiveCamera, Vector2, Vector3 } from 'three'
import { registerCapture } from '@/export/capture'

/**
 * Lets the export flow grab a picture from this canvas at any size: the
 * renderer is resized for one frame, the frame is copied, and everything is
 * put back before the next frame on screen.
 */
export function CaptureRegistrar({ fitWidth }: { fitWidth: number }) {
  const { gl, scene, camera } = useThree()
  const controls = useThree((s) => s.controls) as { target?: Vector3 } | null

  useEffect(() => {
    registerCapture((width, height) => {
      const size = gl.getSize(new Vector2())
      const ratio = gl.getPixelRatio()
      const perspective = camera instanceof PerspectiveCamera ? camera : null
      const aspect = perspective?.aspect
      gl.setPixelRatio(1)
      gl.setSize(width, height, false)
      const position = camera.position.clone()
      if (perspective) {
        perspective.aspect = width / height
        perspective.updateProjectionMatrix()
        // Step back if the picture is narrower than the preview, so the whole pair fits across it
        const target = controls?.target ?? new Vector3()
        const away = position.clone().sub(target)
        const need = (fitWidth * 0.95) / (Math.tan((perspective.fov * Math.PI) / 360) * perspective.aspect)
        if (need > away.length()) camera.position.copy(target).add(away.setLength(need))
      }
      gl.render(scene, camera)
      // Copy while the frame is still in the drawing buffer
      const copy = document.createElement('canvas')
      copy.width = width
      copy.height = height
      copy.getContext('2d')!.drawImage(gl.domElement, 0, 0, width, height)
      camera.position.copy(position)
      gl.setPixelRatio(ratio)
      gl.setSize(size.x, size.y, false)
      if (perspective && aspect !== undefined) {
        perspective.aspect = aspect
        perspective.updateProjectionMatrix()
      }
      gl.render(scene, camera)
      return copy
    })
    return () => registerCapture(null)
  }, [gl, scene, camera, controls, fitWidth])

  return null
}
