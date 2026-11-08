// useDocument: binds the reducer to React, and owns the time-based concerns
// (edit debounce, persistence, streaming orchestration). Components talk to the
// document only through the API this returns.

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { initialState, reducer } from './reducer.js'
import { getVersion, predecessorId } from './model.js'
import * as persistence from './persistence.js'
import { EDIT_DEBOUNCE_MS } from '../../config.js'
import { streamGenerate } from '../llm/client.js'
import { buildMessages } from '../llm/messages.js'

export function useDocument() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = persistence.load()
    return saved ? { ...initialState, ...saved } : initialState
  })

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    persistence.save(state)
  }, [state])

  // --- edit debounce ---
  const timer = useRef(null)
  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const edit = useCallback((text) => {
    dispatch({ type: 'SET_TEXT', text })
    clearTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      dispatch({ type: 'COMMIT', source: 'edit' })
    }, EDIT_DEBOUNCE_MS)
  }, [])

  // Every history interaction first commits any pending manual edit.
  const commitThen = useCallback((action) => {
    clearTimer()
    dispatch({ type: 'COMMIT', source: 'edit' })
    dispatch(action)
  }, [])

  const setCurrent = useCallback((id) => commitThen({ type: 'SET_CURRENT', id }), [commitThen])
  const setCompare = useCallback((id) => commitThen({ type: 'SET_COMPARE', id }), [commitThen])

  // Lock the compare side to the current version's predecessor (dynamic), or
  // unlock it by pinning whatever is currently being compared as a fixed version.
  const setLockToPrevious = useCallback(
    (lock) => {
      if (lock) {
        setCompare(null)
        return
      }
      const { compareId, currentId, versions } = stateRef.current
      const eff =
        compareId != null && compareId !== currentId
          ? compareId
          : predecessorId(versions, currentId)
      if (eff != null) setCompare(eff)
    },
    [setCompare]
  )

  // --- generation ---
  const cancelRef = useRef(null)

  const prompt = useCallback((instruction, opts = {}) => {
    const { quote, config, onComment, onError, onBusy } = opts
    clearTimer()
    dispatch({ type: 'PROMPT_START' })

    const base = stateRef.current.currentText
    const messages = buildMessages({ document: base, instruction, quote })

    onBusy?.(true)

    const handle = streamGenerate(
      messages,
      {
        onText: (text) => dispatch({ type: 'SET_TEXT', text }),
        onComment: (c) => onComment?.(c),
        onDone: () => {
          cancelRef.current = null
          onBusy?.(false)
          dispatch({ type: 'COMMIT', source: 'prompt' })
        },
        onError: (err) => {
          cancelRef.current = null
          onBusy?.(false)
          onError?.(err.message || String(err))
        }
      },
      { config }
    )
    cancelRef.current = handle.cancel
  }, [])

  const stop = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    // Keep whatever streamed so far as a version.
    dispatch({ type: 'COMMIT', source: 'prompt' })
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    cancelRef.current?.()
    cancelRef.current = null
    persistence.clear()
    dispatch({ type: 'RESET' })
  }, [])

  // --- derived selectors ---
  const current = getVersion(state.versions, state.currentId)
  let compareId = state.compareId
  if (compareId == null || compareId === state.currentId) {
    compareId = predecessorId(state.versions, state.currentId)
  }
  const compare = getVersion(state.versions, compareId)

  return {
    versions: state.versions,
    currentText: state.currentText,
    currentId: state.currentId,
    current,
    compareId,
    compare,
    lockedToPrevious: state.compareId == null,
    started: state.started,
    // actions
    edit,
    prompt,
    stop,
    setCurrent,
    setCompare,
    setLockToPrevious,
    reset
  }
}
