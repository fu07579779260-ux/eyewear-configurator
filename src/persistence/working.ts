import { useSyncExternalStore } from 'react'
import type { EyewearConfig } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'

// The design being worked on is kept in this browser between visits
// (localStorage), together with which saved design it belongs to, if any.

const CURRENT = 'eyewear.current'
const OPEN = 'eyewear.open'

export function loadWorkingDesign(): EyewearConfig | null {
  try {
    const raw = localStorage.getItem(CURRENT)
    return raw ? sanitizeConfig(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveWorkingDesign(config: EyewearConfig) {
  try {
    localStorage.setItem(CURRENT, JSON.stringify(config))
  } catch {
    // Storage full or blocked: the design still works for this visit
  }
}

/** The id of the saved design the configurator is editing, or null for a new design. */
let open: string | null = (() => {
  try {
    return localStorage.getItem(OPEN)
  } catch {
    return null
  }
})()
const listeners = new Set<() => void>()

export const openDesign = {
  get: () => open,
  set(next: string | null) {
    open = next
    try {
      if (next) localStorage.setItem(OPEN, next)
      else localStorage.removeItem(OPEN)
    } catch {
      // Not remembered; fine for this visit
    }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export const useOpenDesign = () => useSyncExternalStore(openDesign.subscribe, openDesign.get)
