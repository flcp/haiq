// localStorage persistence for the document state. Swap this module to change
// where/how the document is stored (e.g. a backend) without touching the store.

import { STORAGE_KEY } from '../../config.js'

const KEYS = ['versions', 'currentId', 'currentText', 'compareId', 'started']

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save(state) {
  try {
    const subset = {}
    for (const k of KEYS) subset[k] = state[k]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subset))
  } catch {
    /* quota / serialization — ignore, app still works in memory */
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
