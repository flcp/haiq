import { useEffect, useRef } from 'react'
import { MergeView } from '@codemirror/merge'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { EditorState, Annotation } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { docTheme, selectedText } from './codemirror.js'

const External = Annotation.define()

// Side-by-side diff. Left = compare version (read-only). Right = current
// document (editable); the current document is ALWAYS the right pane. Selecting
// text in the right pane reports it via onQuote.
export default function SplitCompare({ leftText, rightText, onChangeRight, onQuote }) {
  const host = useRef(null)
  const mergeRef = useRef(null)
  const onChangeRef = useRef(onChangeRight)
  const onQuoteRef = useRef(onQuote)
  onChangeRef.current = onChangeRight
  onQuoteRef.current = onQuote

  useEffect(() => {
    const rightUpdates = EditorView.updateListener.of((u) => {
      if (u.docChanged && u.transactions.some((t) => !t.annotation(External))) {
        onChangeRef.current?.(u.state.doc.toString())
      }
      if (u.selectionSet || u.docChanged) {
        onQuoteRef.current?.(selectedText(u.state))
      }
    })
    const common = [EditorView.lineWrapping, lineNumbers(), docTheme]
    const merge = new MergeView({
      parent: host.current,
      a: {
        doc: leftText ?? '',
        extensions: [...common, EditorState.readOnly.of(true), EditorView.editable.of(false)]
      },
      b: {
        doc: rightText ?? '',
        extensions: [...common, history(), keymap.of([...defaultKeymap, ...historyKeymap]), rightUpdates]
      },
      highlightChanges: true,
      gutter: true
    })
    mergeRef.current = merge
    return () => merge.destroy()
  }, [leftText])

  // Keep the right side in sync with external updates (e.g. live streaming).
  useEffect(() => {
    const view = mergeRef.current?.b
    if (!view) return
    const current = view.state.doc.toString()
    if (rightText === current) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: rightText ?? '' },
      annotations: External.of(true)
    })
  }, [rightText])

  // Lock the two panes to scroll together.
  useEffect(() => {
    const a = mergeRef.current?.a?.scrollDOM
    const b = mergeRef.current?.b?.scrollDOM
    if (!a || !b) return
    let lock = false
    const mirror = (src, dst) => () => {
      if (lock) return
      lock = true
      dst.scrollTop = src.scrollTop
      dst.scrollLeft = src.scrollLeft
      lock = false
    }
    const sa = mirror(a, b)
    const sb = mirror(b, a)
    a.addEventListener('scroll', sa)
    b.addEventListener('scroll', sb)
    return () => {
      a.removeEventListener('scroll', sa)
      b.removeEventListener('scroll', sb)
    }
  }, [leftText])

  return <div className="cm-merge-host" ref={host} />
}
