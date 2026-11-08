import { useEffect, useState } from 'react'

const KEY = 'haiq:v2:theme'

// Light/dark theme. Default light. Applied as data-theme on <html> so CSS
// variables switch; persisted across reloads.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  const reset = () => setTheme('light')
  return { theme, toggle, reset }
}
