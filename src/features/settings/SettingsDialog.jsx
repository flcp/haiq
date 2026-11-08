import { useState } from 'react'
import Switch from '../../Switch.jsx'

// Settings modal: Appearance (theme) + LiteLLM connection. The API key stays on-device.
export default function SettingsDialog({ settings, onSave, onReset, onClose, theme, onToggleTheme }) {
  const [draft, setDraft] = useState(settings)
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))

  const save = () => {
    onSave({
      baseUrl: draft.baseUrl.trim(),
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim()
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Settings</h2>

        <section className="settings-section">
          <h3 className="section-title">Appearance</h3>
          <label className="toggle-row">
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            <Switch checked={theme === 'dark'} onChange={onToggleTheme} ariaLabel="Dark mode" />
          </label>
        </section>

        <section className="settings-section">
          <h3 className="section-title">LiteLLM</h3>

          <label className="field">
            <span>Endpoint base URL</span>
            <input value={draft.baseUrl} onChange={set('baseUrl')} placeholder="http://localhost:6655/litellm" />
            <small>haiq calls <code>{'{base}'}/v1/chat/completions</code> (OpenAI-compatible).</small>
          </label>

          <label className="field">
            <span>API key</span>
            <input type="password" value={draft.apiKey} onChange={set('apiKey')} placeholder="sk-…" />
            <small>Stored on this device only.</small>
          </label>

          <label className="field">
            <span>Model</span>
            <input value={draft.model} onChange={set('model')} placeholder="claude-opus-4-8" />
          </label>
        </section>

        <div className="modal-actions">
          <button type="button" className="link-btn" onClick={() => { onReset(); onClose() }} title="Reset all settings to defaults — appearance and the saved connection, including the API key">
            Reset settings
          </button>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="send-btn" onClick={save} disabled={!draft.baseUrl.trim() || !draft.model.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
