import type { EyewearConfig } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'

// "My designs" (PLAN.md §7): saved glasses, kept in this browser only
// (IndexedDB). Nothing is uploaded. The storage is passed in, so the logic
// can be tested without a browser.

export interface SavedDesign {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  config: EyewearConfig
  /** Small JPEG of the 3D view, as a data URL */
  thumbnail: string | null
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
}

const INDEX = 'designs'
/** Longest design name, in characters. */
export const MAX_NAME_LENGTH = 40

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const cleanName = (name: string, fallback: string) =>
  Array.from(name.replace(/\s+/g, ' ').trim()).slice(0, MAX_NAME_LENGTH).join('') || fallback

/**
 * Designs that share a frame: same shape, fit and frame colour. Their
 * temples are interchangeable (the hinge connection is the same on every
 * design anyway), so the library can point out which designs are temple
 * variations of one frame.
 */
export function frameKey(config: EyewearConfig): string {
  return JSON.stringify([config.shape, config.fit, config.colour.frame])
}

export function createDesignLibrary(store: KeyValueStore) {
  let cache: SavedDesign[] | null = null
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  async function load(): Promise<SavedDesign[]> {
    if (cache) return cache
    const raw = (await store.get<SavedDesign[]>(INDEX)) ?? []
    // Older or edited entries are made valid again
    cache = raw
      .filter((d) => d && typeof d.id === 'string')
      .map((d) => ({ ...d, name: cleanName(String(d.name ?? ''), 'Glasses'), config: sanitizeConfig(d.config) }))
    // Pages that rendered before the first read show the designs now
    emit()
    return cache
  }

  async function write(next: SavedDesign[]) {
    cache = next
    await store.set(INDEX, next)
    emit()
  }

  return {
    load,
    /** Newest first; empty until loaded. */
    snapshot: () => cache ?? EMPTY,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async get(id: string) {
      return (await load()).find((d) => d.id === id) ?? null
    },

    /** Save as a new design; returns its id. */
    async create(name: string, config: EyewearConfig, thumbnail: string | null, fallbackName = 'Glasses') {
      const now = new Date().toISOString()
      const design: SavedDesign = {
        id: newId(),
        name: cleanName(name, fallbackName),
        createdAt: now,
        updatedAt: now,
        config: structuredClone(config),
        thumbnail,
      }
      await write([design, ...(await load())])
      return design.id
    },

    /** Store the current state of a saved design (moves it to the top). */
    async update(id: string, config: EyewearConfig, thumbnail: string | null) {
      const all = await load()
      const design = all.find((d) => d.id === id)
      if (!design) return false
      const updated = { ...design, config: structuredClone(config), thumbnail: thumbnail ?? design.thumbnail, updatedAt: new Date().toISOString() }
      await write([updated, ...all.filter((d) => d.id !== id)])
      return true
    },

    async rename(id: string, name: string) {
      const all = await load()
      await write(all.map((d) => (d.id === id ? { ...d, name: cleanName(name, d.name) } : d)))
    },

    /** A copy next to the original; returns the copy's id. */
    async duplicate(id: string, copyName: (name: string) => string) {
      const all = await load()
      const design = all.find((d) => d.id === id)
      if (!design) return null
      const now = new Date().toISOString()
      const copy: SavedDesign = { ...structuredClone(design), id: newId(), name: cleanName(copyName(design.name), design.name), createdAt: now, updatedAt: now }
      const at = all.indexOf(design)
      await write([...all.slice(0, at + 1), copy, ...all.slice(at + 1)])
      return copy.id
    },

    async remove(id: string) {
      await write((await load()).filter((d) => d.id !== id))
    },
  }
}

const EMPTY: SavedDesign[] = []

export type DesignLibrary = ReturnType<typeof createDesignLibrary>
