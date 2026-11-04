import type { File3dm, RhinoModule } from 'rhino3dm'
import type { MeshData } from '@/geometry/manifold-mesh'

/**
 * .3dm writer (rhino3dm). Model units are millimetres and Rhino is Z-up, so
 * the scene's (x, y, z) is written as (x, −z, y). The parts sit where they go
 * on the finished glasses, each on its own named, coloured layer, with the
 * lenses on a reference layer, so the design can be developed further in Rhino.
 *
 * Files are written in Rhino 7 format: Rhino 7 and Rhino 8 both open it.
 */
export const RHINO_FILE_VERSION = 7

export interface RhinoPart {
  mesh: MeshData
  /** Layer and object name, e.g. "Front frame" */
  name: string
  /** Hex colour for the layer */
  colour: string
}

// Embind objects live on the WASM heap and must be freed by hand
type Deletable = { delete(): void }
const free = (...objects: unknown[]) => objects.forEach((o) => (o as Deletable).delete())

const rgba = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
  a: 255,
})

function addLayer(rhino: RhinoModule, doc: File3dm, name: string, colour: string): number {
  const layer = new rhino.Layer()
  layer.name = name
  layer.color = rgba(colour)
  const index = doc.layers().add(layer)
  free(layer)
  return index
}

function toRhinoMesh(rhino: RhinoModule, { positions: P, indices: I }: MeshData) {
  const m = new rhino.Mesh()
  const vertices = m.vertices()
  for (let i = 0; i < P.length; i += 3) vertices.add(P[i], -P[i + 2], P[i + 1])
  const faces = m.faces()
  for (let f = 0; f < I.length; f += 3) faces.addTriFace(I[f], I[f + 1], I[f + 2])
  m.normals().computeNormals()
  m.compact()
  return m
}

/** Build a .3dm file in memory, one layer per part (parts with the same name share a layer). */
export function write3dm(rhino: RhinoModule, parts: RhinoPart[], title: string): Uint8Array {
  const doc = new rhino.File3dm()
  doc.applicationName = 'Eyewear Configurator'
  doc.settings().modelUnitSystem = rhino.UnitSystem.Millimeters

  const layers = new Map<string, number>()
  for (const part of parts) {
    let layerIndex = layers.get(part.name)
    if (layerIndex === undefined) {
      layerIndex = addLayer(rhino, doc, part.name, part.colour)
      layers.set(part.name, layerIndex)
    }
    const mesh = toRhinoMesh(rhino, part.mesh)
    const attributes = new rhino.ObjectAttributes()
    attributes.layerIndex = layerIndex
    attributes.name = `${title} – ${part.name}`
    doc.objects().add(mesh, attributes)
    free(mesh, attributes)
  }

  const options = new rhino.File3dmWriteOptions()
  options.version = RHINO_FILE_VERSION
  const bytes = doc.toByteArrayOptions(options)
  free(options, doc)
  return bytes
}
