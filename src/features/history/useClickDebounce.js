import { useCallback, useEffect, useRef } from 'react'
import { CLICK_DEBOUNCE_MS } from '../../config.js'

// Returns a click handler that fires onSingle after a short delay, or onDouble
// immediately if a second click lands within that delay. Lets a single click
// (set compare) and a double click (set current) coexist on one element.
export function useClickDebounce(onSingle, onDouble, delay = CLICK_DEBOUNCE_MS) {
  const timer = useRef(null)
  const singleRef = useRef(onSingle)
  const doubleRef = useRef(onDouble)
  singleRef.current = onSingle
  doubleRef.current = onDouble

  useEffect(() => () => timer.current && clearTimeout(timer.current), [])

  return useCallback(
    (arg) => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
        doubleRef.current?.(arg)
      } else {
        timer.current = setTimeout(() => {
          timer.current = null
          singleRef.current?.(arg)
        }, delay)
      }
    },
    [delay]
  )
}
