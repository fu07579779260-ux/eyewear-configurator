import { createStore, get, set } from 'idb-keyval'
import { useEffect, useSyncExternalStore } from 'react'
import { createDesignLibrary, type SavedDesign } from './designs'

// Its own IndexedDB database, so it never mixes with other apps on the same site (the perfume configurator)
const store = createStore('eyewear-configurator', 'library')

/** The design library of this browser, in IndexedDB. */
export const library = createDesignLibrary({
  get: (key) => get(key, store),
  set: (key, value) => set(key, value, store),
})

/** All saved designs, newest first; loads them on first use. */
export function useSavedDesigns(): SavedDesign[] {
  useEffect(() => {
    void library.load().catch((error) => console.error('Could not read saved designs', error))
  }, [])
  return useSyncExternalStore(library.subscribe, library.snapshot)
}
