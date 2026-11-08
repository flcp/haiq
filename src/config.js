// App-wide constants. Tunable in one place.

// Commit a version this long after the user stops typing manual edits.
export const EDIT_DEBOUNCE_MS = 2000

// Distinguish a single click (set compare) from a double click (set current).
export const CLICK_DEBOUNCE_MS = 220

// The three workspace views the cycle control toggles between.
//   edit   → plain editing
//   inline → single-pane annotated diff (additions / strikethrough)
//   split  → two-pane side-by-side diff
export const VIEWS = ['edit', 'inline', 'split']
export const VIEW_LABELS = { edit: 'Edit', inline: 'Diff', split: 'Split' }

// localStorage key for the persisted document.
export const STORAGE_KEY = 'haiq:v2'

// localStorage key + defaults for the LLM connection settings (entered in the
// Settings dialog; the API key lives on-device, not in the binary).
export const SETTINGS_KEY = 'haiq:v2:settings'
export const DEFAULT_SETTINGS = {
  baseUrl: 'http://localhost:6655/litellm',
  apiKey: '',
  model: 'claude-opus-4-8'
}

// Name of the "attach selection to the next prompt" feature.
export const QUOTE_VERB = 'Quote'
