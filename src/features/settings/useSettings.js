import { useCallback, useEffect, useState } from 'react'
import { SETTINGS_KEY, DEFAULT_SETTINGS } from '../../config.js'

// LLM connection settings, persisted on-device in localStorage.
export function useSettings() {
  const [storedSettings, setStoredSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (storedSettings === null) {
        localStorage.removeItem(SETTINGS_KEY)
      } else {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(storedSettings))
      }
    } catch {
      /* ignore */
    }
  }, [storedSettings])

  const settings = storedSettings ?? DEFAULT_SETTINGS
  const update = useCallback((patch) => setStoredSettings((previous) => ({ ...DEFAULT_SETTINGS, ...previous, ...patch })), [])
  const reset = useCallback(() => setStoredSettings(null), [])
  const configured = Boolean(settings.baseUrl && settings.apiKey && settings.model)

  return { settings, update, reset, configured }
}
