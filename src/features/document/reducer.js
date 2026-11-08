// The document reducer: the single source of truth for versions + current/compare.
// Pure and self-contained so it can be tested or swapped in isolation.

import { getVersion, makeVersion, nextNumber } from './model.js'

export const initialState = {
  versions: [], // creation-ordered list of snapshots
  currentId: null, // version the editable buffer is based on
  currentText: '', // live editable buffer (may lead the current version)
  compareId: null, // explicit compare selection; null → use current's predecessor
  started: false // has the first generation happened (controls hero vs workspace)
}

// Commit `currentText` as a new version unless it adds nothing.
function commit(state, source) {
  const cur = getVersion(state.versions, state.currentId)
  const text = state.currentText
  const unchanged = cur && cur.text === text
  const emptyRoot = !cur && !text.trim()
  if (unchanged || emptyRoot) return { ...state, started: true }
  const v = makeVersion({ text, source, parentId: state.currentId, n: nextNumber(state.versions) })
  return { ...state, versions: [...state.versions, v], currentId: v.id, started: true }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, currentText: action.text }

    case 'COMMIT':
      return commit(state, action.source)

    // Beginning of a generation: snapshot any uncommitted manual edit as its own
    // version first. Compare stays on the predecessor-default, which resolves to
    // the pre-prompt version once the result is committed.
    case 'PROMPT_START':
      return { ...commit(state, 'edit'), started: true }

    case 'SET_CURRENT': {
      const v = getVersion(state.versions, action.id)
      if (!v) return state
      return { ...state, currentId: v.id, currentText: v.text }
    }

    case 'SET_COMPARE':
      return { ...state, compareId: action.id }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}
