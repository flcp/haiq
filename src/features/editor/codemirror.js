// Shared CodeMirror theme + helpers used by all three editor surfaces.
import { EditorView } from '@codemirror/view'

// Serif document text; monospace only for the line-number gutter. Both share one
// line-height so the numbers stay aligned with their text lines.
export const docTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '16px' },
  '.cm-scroller': {
    fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: '1.7'
  },
  '.cm-content': { padding: '12px 16px', caretColor: 'var(--accent)' },
  '.cm-gutters': {
    lineHeight: '1.7',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
  }
})

// The current (main) selection's text, or '' when nothing is selected.
export function selectedText(state) {
  const sel = state.selection.main
  return sel.empty ? '' : state.sliceDoc(sel.from, sel.to)
}
