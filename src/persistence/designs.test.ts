import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, RANGES } from '@/model/config'
import { designReducer } from '@/model/reducer'
import { createDesignLibrary, frameKey, MAX_NAME_LENGTH, type KeyValueStore } from './designs'

function memoryStore(initial: Record<string, unknown> = {}): KeyValueStore & { data: Record<string, unknown> } {
  const data: Record<string, unknown> = structuredClone(initial)
  return {
    data,
    get: async <T,>(key: string) => structuredClone(data[key]) as T | undefined,
    set: async (key, value) => {
      data[key] = structuredClone(value)
    },
  }
}

const navy = designReducer(structuredClone(DEFAULT_CONFIG), { type: 'patch', section: 'colour', values: { frame: 'navy' } })

describe('design library', () => {
  it('saves, lists newest first and reopens designs', async () => {
    const store = memoryStore()
    const lib = createDesignLibrary(store)
    const a = await lib.create('First', DEFAULT_CONFIG, null)
    const b = await lib.create('  Second   pair ', navy, 'data:image/jpeg;base64,x')
    expect(lib.snapshot().map((d) => d.name)).toEqual(['Second pair', 'First'])
    expect((await lib.get(b))?.config.colour.frame).toBe('navy')
    expect((await lib.get(a))?.thumbnail).toBeNull()
    // Written through to the store
    expect((store.data.designs as unknown[]).length).toBe(2)
  })

  it('names unnamed designs and shortens long names', async () => {
    const lib = createDesignLibrary(memoryStore())
    const id = await lib.create('   ', DEFAULT_CONFIG, null, 'Rounded square glasses')
    expect((await lib.get(id))?.name).toBe('Rounded square glasses')
    const long = await lib.create('x'.repeat(100), DEFAULT_CONFIG, null)
    expect((await lib.get(long))?.name).toHaveLength(MAX_NAME_LENGTH)
  })

  it('updates a design, keeping its thumbnail when there is no new one, and moves it to the top', async () => {
    const lib = createDesignLibrary(memoryStore())
    const a = await lib.create('A', DEFAULT_CONFIG, 'thumb-a')
    await lib.create('B', DEFAULT_CONFIG, null)
    expect(await lib.update(a, navy, null)).toBe(true)
    const [first] = lib.snapshot()
    expect(first.id).toBe(a)
    expect(first.config.colour.frame).toBe('navy')
    expect(first.thumbnail).toBe('thumb-a')
    expect(await lib.update('missing', navy, null)).toBe(false)
  })

  it('renames, duplicates next to the original, and deletes', async () => {
    const lib = createDesignLibrary(memoryStore())
    const b = await lib.create('B', DEFAULT_CONFIG, null)
    const a = await lib.create('A', navy, null)
    await lib.rename(a, 'Navy pair')
    const copy = await lib.duplicate(a, (name) => `${name} (copy)`)
    expect(lib.snapshot().map((d) => d.name)).toEqual(['Navy pair', 'Navy pair (copy)', 'B'])
    expect(copy).not.toBe(a)
    await lib.remove(a)
    expect(lib.snapshot().map((d) => d.id)).toEqual([copy, b])
  })

  it('repairs stored designs when reading them back', async () => {
    const broken = {
      designs: [
        { id: 'x1', name: '', createdAt: '', updatedAt: '', thumbnail: null, config: { fit: { bridge: 99 }, colour: { frame: 'gold' } } },
        null,
        { name: 'no id' },
      ],
    }
    const lib = createDesignLibrary(memoryStore(broken))
    const designs = await lib.load()
    expect(designs).toHaveLength(1)
    expect(designs[0].name).toBe('Glasses')
    expect(designs[0].config.fit.bridge).toBe(RANGES.fit.bridge.max)
    expect(designs[0].config.colour.frame).toBe('sand')
  })

  it('tells subscribers when the designs change', async () => {
    const lib = createDesignLibrary(memoryStore())
    let calls = 0
    const stop = lib.subscribe(() => calls++)
    await lib.create('A', DEFAULT_CONFIG, null)
    stop()
    await lib.create('B', DEFAULT_CONFIG, null)
    expect(calls).toBeGreaterThanOrEqual(1)
    const before = calls
    await lib.create('C', DEFAULT_CONFIG, null)
    expect(calls).toBe(before)
  })
})

describe('frameKey', () => {
  it('matches designs that share a frame, whatever their temples', () => {
    const ribbed = designReducer(structuredClone(DEFAULT_CONFIG), { type: 'patch', section: 'texture', values: { type: 'ribbed' } })
    const sageTemples = designReducer(ribbed, { type: 'patch', section: 'colour', values: { temple: 'sage' } })
    expect(frameKey(sageTemples)).toBe(frameKey(DEFAULT_CONFIG))
    expect(frameKey(navy)).not.toBe(frameKey(DEFAULT_CONFIG))
    const wider = designReducer(structuredClone(DEFAULT_CONFIG), { type: 'patch', section: 'fit', values: { frameWidth: 146 } })
    expect(frameKey(wider)).not.toBe(frameKey(DEFAULT_CONFIG))
  })
})
