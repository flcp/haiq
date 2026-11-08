import { VIEWS, VIEW_LABELS } from '../../config.js'

// Segmented control to switch between the three workspace views.
export default function ViewSwitcher({ value, onChange }) {
  return (
    <div className="view-switcher" role="tablist" aria-label="View">
      {VIEWS.map((v) => (
        <button
          key={v}
          role="tab"
          aria-selected={v === value}
          className={v === value ? 'vs-seg is-active' : 'vs-seg'}
          onClick={() => onChange(v)}
        >
          {VIEW_LABELS[v]}
        </button>
      ))}
    </div>
  )
}
