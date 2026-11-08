import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { EditorState, Annotation } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { docTheme, selectedText } from './codemirror.js'

// Marks programmatic doc replacements so they are not echoed back as user edits.
const External = Annotation.define()

// The editable current document (Edit view). Selecting text reports it via
// onQuote (live selection → quote box); '' when the selection is empty.
export default function PlainEditor({ value, onChange, onQuote }) {
  const host = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onQuoteRef = useRef(onQuote)
  onChangeRef.current = onChange
  onQuoteRef.current = onQuote

  useEffect(() => {
    const listener = EditorView.updateListener.of((u) => {
      if (u.docChanged && u.transactions.some((t) => !t.annotation(External))) {
        onChangeRef.current?.(u.state.doc.toString())
      }
      if (u.selectionSet || u.docChanged) {
        onQuoteRef.current?.(selectedText(u.state))
      }
    })
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value ?? '',
        extensions: [
          lineNumbers(),
          EditorView.lineWrapping,
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          listener,
          docTheme
        ]
      })
    })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  // Sync external value changes (streaming, version load) into the editor.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (value === current) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value ?? '' },
      annotations: External.of(true)
    })
  }, [value])

  return <div className="cm-host" ref={host} />
}
