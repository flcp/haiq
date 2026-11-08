import PlainEditor from '../editor/PlainEditor.jsx'
import SplitCompare from '../editor/SplitCompare.jsx'
import InlineCompare from '../editor/InlineCompare.jsx'
import ViewSwitcher from './ViewSwitcher.jsx'

// Version label + timestamp (timestamp de-emphasised).
function Title({ version, fallback = 'current', suffix }) {
  return (
    <>
      {version?.label ?? fallback}
      {version?.ts && <span className="ts-dim"> {version.ts}</span>}
      {suffix && <em> {suffix}</em>}
    </>
  )
}

// Renders the active view. The current document is editable in every view
// (plain in 'edit', the right pane in 'split', inline in 'inline'). The view
// switcher lives in this card's header row, beside the version labels.
export default function Workspace({ view, onViewChange, currentText, current, compare, onEditCurrent, onQuote }) {
  let labels
  let body
  let inline = false

  if (view === 'edit' || !compare) {
    // Plain editing — either the 'edit' view, or a compare view with nothing
    // earlier to diff against yet.
    labels = (
      <span className="pane-label">
        <Title version={current} />
        {view !== 'edit' && <em> · nothing earlier to compare yet</em>}
      </span>
    )
    body = <PlainEditor value={currentText} onChange={onEditCurrent} onQuote={onQuote} />
  } else if (view === 'split') {
    labels = (
      <>
        <span className="pane-label">
          <Title version={compare} suffix="(read only)" />
        </span>
        <span className="pane-label">
          <Title version={current} suffix="(editable)" />
        </span>
      </>
    )
    body = (
      <SplitCompare
        leftText={compare.text}
        rightText={currentText}
        onChangeRight={onEditCurrent}
        onQuote={onQuote}
      />
    )
  } else {
    // inline (Diff): compare → current, timestamps de-emphasised
    inline = true
    labels = (
      <span className="pane-label">
        <Title version={compare} />
        <span className="title-sep"> → </span>
        <Title version={current} />
      </span>
    )
    body = (
      <InlineCompare
        oldText={compare.text}
        newText={currentText}
        onChange={onEditCurrent}
        onQuote={onQuote}
      />
    )
  }

  return (
    <div className="doc-surface">
      <div className={`pane-labels${inline ? ' pane-labels--inline' : ''}`}>
        <div className="pane-labels-group">{labels}</div>
        <ViewSwitcher value={view} onChange={onViewChange} />
      </div>
      {body}
    </div>
  )
}
