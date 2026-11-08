import { useCallback, useRef, useState } from 'react'
import { useDocument } from './features/document/useDocument.js'
import Workspace from './features/viewswitch/Workspace.jsx'
import HistoryPanel from './features/history/HistoryPanel.jsx'
import PromptBar from './features/prompt/PromptBar.jsx'
import CommentField from './features/comment/CommentField.jsx'
import { useTheme } from './features/theme/useTheme.js'
import { useSettings } from './features/settings/useSettings.js'
import SettingsDialog from './features/settings/SettingsDialog.jsx'
import BrandMark from './BrandMark.jsx'

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function App() {
  const doc = useDocument()
  const { theme, toggle: toggleTheme, reset: resetTheme } = useTheme()
  const { settings, update: updateSettings, reset: resetSettings, configured } = useSettings()

  const [view, setView] = useState('edit')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [quote, setQuote] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)

  const promptRef = useRef(null)

  const handleSend = useCallback(
    (instruction) => {
      if (!configured) {
        setError('Add your endpoint and API key in Settings first.')
        setSettingsOpen(true)
        return
      }
      const hadBase = !!doc.current || doc.currentText.trim().length > 0
      setError(null)
      setComment('')
      doc.prompt(instruction, {
        quote,
        config: settings,
        onComment: setComment,
        onError: setError,
        onBusy: setBusy
      })
      setQuote(null)
      setView(hadBase ? 'split' : 'edit') // prompts default to the split view
    },
    [doc, quote, settings, configured]
  )

  const stop = useCallback(() => {
    doc.stop()
    setBusy(false)
  }, [doc])

  const resetAll = useCallback(() => {
    doc.reset()
    setView('edit')
    setComment('')
    setError(null)
    setQuote(null)
    setBusy(false)
    setConfirmNew(false)
  }, [doc])

  // Selecting text in the document mirrors it into the quote box; an empty
  // selection clears it. (The ✕ on the chip also clears it.)
  const handleQuote = useCallback((text) => {
    setQuote((text || '').trim() || null)
  }, [])

  const resetSettingsAll = useCallback(() => {
    resetSettings()
    resetTheme()
  }, [resetSettings, resetTheme])

  const settingsBtn = (
    <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
      <GearIcon />
    </button>
  )

  const dialog = settingsOpen && (
    <SettingsDialog
      settings={settings}
      onSave={updateSettings}
      onReset={resetSettingsAll}
      onClose={() => setSettingsOpen(false)}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )

  const confirmNewDialog = confirmNew && (
    <div className="modal-backdrop" onClick={() => setConfirmNew(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Start a new document?</h2>
        <p className="modal-text">This clears the current text and all versions.</p>
        <div className="modal-actions">
          <button type="button" className="link-btn" onClick={() => setConfirmNew(false)}>
            Cancel
          </button>
          <button type="button" className="pill-btn" onClick={resetAll}>
            Start new
          </button>
        </div>
      </div>
    </div>
  )

  const errorBanner = error && (
    <div className="error-banner" role="alert">
      <span>{error}</span>
      <button
        type="button"
        className="error-dismiss"
        onClick={() => setError(null)}
        title="Dismiss error"
        aria-label="Dismiss error"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  )

  // Hero screen before anything exists.
  if (!doc.started && doc.versions.length === 0 && !doc.currentText) {
    return (
      <div className="app app--hero">
        <div className="hero-corner">{settingsBtn}</div>
        <PromptBar onSend={handleSend} onStop={stop} busy={busy} centered inputRef={promptRef} />
        {errorBanner}
        {dialog}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <BrandMark size={24} />
          haiq
        </span>
        <div className="topbar-right">
          {settingsBtn}
          <button className="pill-btn" onClick={() => setConfirmNew(true)}>
            New document
          </button>
        </div>
      </header>

      <div className="main">
        <section className="workspace">
          <div className="doc-area">
            <Workspace
              view={view}
              onViewChange={setView}
              currentText={doc.currentText}
              current={doc.current}
              compare={doc.compare}
              onEditCurrent={doc.edit}
              onQuote={handleQuote}
            />
          </div>

          <CommentField comment={comment} />

          <PromptBar
            onSend={handleSend}
            onStop={stop}
            busy={busy}
            quote={quote}
            onClearQuote={() => setQuote(null)}
            inputRef={promptRef}
          />
        </section>

        <HistoryPanel
          versions={doc.versions}
          currentId={doc.currentId}
          compareId={doc.compareId}
          lockedToPrevious={doc.lockedToPrevious}
          onSetCurrent={doc.setCurrent}
          onSetCompare={doc.setCompare}
          onToggleLock={doc.setLockToPrevious}
        />
      </div>

      {errorBanner}
      {dialog}
      {confirmNewDialog}
    </div>
  )
}
