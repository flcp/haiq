import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { EditorState, Annotation } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { unifiedMergeView } from '@codemirror/merge'
import { docTheme, selectedText } from './codemirror.js'

const External = Annotation.define()

// Inline (unified) diff of the current document against `oldText` (the compare
// version). Editable: the current document is the editor's doc, and the inline
// additions (highlighted) / deletions (struck through) update live as you type.
// Selecting text reports it via onQuote.
export default function InlineCompare({ oldText, newText, onChange, onQuote }) {
  const host = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onQuoteRef = useRef(onQuote)
  onChangeRef.current = onChange
  onQuoteRef.current = onQuote

  // Rebuild when the comparison baseline changes.
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
        doc: newText ?? '',
        extensions: [
          lineNumbers(),
          EditorView.lineWrapping,
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          unifiedMergeView({
            original: oldText ?? '',
            mergeControls: false,
            allowInlineDiffs: true
          }),
          listener,
          docTheme
        ]
      })
    })
    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldText])

  // Sync external changes to the current document (streaming, version switch).
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (newText === current) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: newText ?? '' },
      annotations: External.of(true)
    })
  }, [newText])

  return <div className="cm-inline-host" ref={host} />
}
