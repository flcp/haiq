import { useState } from 'react'
import { QUOTE_VERB } from '../../config.js'
import BrandMark from '../../BrandMark.jsx'

const MAX_CHIP = 90

// Lucide "arrow-up" (lucide.dev, ISC) — shown when a prompt is ready to send.
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

// A filled square — shown while a response is generating.
function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  )
}

// Resize grip oriented for the top-right corner (lines parallel to the corner).
function GripIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M8 0 L16 8 M12 0 L16 4" />
    </svg>
  )
}

const MIN_H = 92
const MAX_H = 600

// Prominent prompt input.
//   Enter            → send
//   ⌘/Ctrl + Enter   → newline
//   Shift + Enter     → newline
export default function PromptBar({
  onSend,
  onStop,
  busy,
  centered,
  quote,
  onClearQuote,
  inputRef
}) {
  const [value, setValue] = useState('')
  const [height, setHeight] = useState(null)

  // Custom top-right resize: drag up to grow the box, down to shrink.
  const onResizeStart = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = inputRef?.current?.offsetHeight ?? MIN_H
    const onMove = (ev) => {
      const next = Math.min(MAX_H, Math.max(MIN_H, startH + (startY - ev.clientY)))
      setHeight(next)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const send = () => {
    const text = value.trim()
    if (!text || busy) return
    onSend(text)
    setValue('')
  }

  const insertNewline = (el) => {
    const { selectionStart: s, selectionEnd: e } = el
    const next = value.slice(0, s) + '\n' + value.slice(e)
    setValue(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + 1
    })
  }

  const onKeyDown = (e) => {
    // Backspace on an empty input removes the attached quote first.
    if (e.key === 'Backspace' && value.length === 0 && quote) {
      e.preventDefault()
      onClearQuote()
      return
    }
    if (e.key !== 'Enter') return
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      insertNewline(e.target)
    } else if (!e.shiftKey) {
      e.preventDefault()
      send()
    }
    // Shift+Enter falls through to the textarea's default newline.
  }

  const chip =
    quote && quote.length > MAX_CHIP ? quote.slice(0, MAX_CHIP).trimEnd() + '…' : quote

  return (
    <div className={centered ? 'promptbar promptbar--hero' : 'promptbar'}>
      {centered && (
        <h1 className="hero-title">
          <BrandMark size={36} />
          haiq
        </h1>
      )}
      {centered && <p className="hero-sub">Write with AI. Prompt, edit, and step back through versions.</p>}

      {/* The quote chip is the first line inside the prompt box. */}
      <div className={busy ? 'prompt-box is-busy' : 'prompt-box'}>
        <span
          className="resize-grip"
          onPointerDown={onResizeStart}
          title="Drag to resize"
          aria-hidden="true"
        >
          <GripIcon />
        </span>
        {quote && (
          <div className="quote-chip" title={quote}>
            <span className="quote-label">{QUOTE_VERB.toUpperCase()}</span>
            <span className="quote-text">“{chip}”</span>
            <button className="quote-clear" onClick={onClearQuote} aria-label="Remove quote">
              ✕
            </button>
          </div>
        )}

        <div className="prompt-row">
          <div className="prompt-main">
            <textarea
              ref={inputRef}
              className="prompt-input"
              placeholder={
                quote
                  ? `How should the ${QUOTE_VERB.toLowerCase()}d text change? e.g. “make this clearer”`
                  : centered
                    ? 'Describe what you want to write…'
                    : 'Ask for a change, or write a new instruction…'
              }
              value={value}
              disabled={busy}
              style={height ? { height } : undefined}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
            />
            {/* Hint sits at the bottom of the input column, only while empty. */}
            {value.length === 0 && (
              <span className="prompt-hint">Enter to send · ⌘/Ctrl+Enter for a new line</span>
            )}
          </div>
          <button
            className="send-btn send-btn--icon"
            onClick={busy ? onStop : send}
            disabled={!busy && !value.trim()}
            title={busy ? 'Stop' : 'Send'}
            aria-label={busy ? 'Stop' : 'Send'}
          >
            {busy ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  )
}
