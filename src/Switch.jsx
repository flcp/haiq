// A slidable on/off toggle (a styled checkbox): thumb sits left when off,
// slides right when on. Used for binary settings like theme and compare mode.
export default function Switch({ checked, onChange, disabled = false, ariaLabel }) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </span>
  )
}
