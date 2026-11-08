import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useClickDebounce } from './useClickDebounce.js'
import HistoryGraph, { LANE } from './HistoryGraph.jsx'
import Switch from '../../Switch.jsx'

function LockIcon({ locked }) {
  return (
    <svg
      className="lock-icon"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4.5" y="11" width="15" height="10" rx="2" />
      {locked ? <path d="M8 11V7a4 4 0 0 1 8 0v4" /> : <path d="M8 11V7a4 4 0 0 1 7.5-1.6" />}
    </svg>
  )
}

// Lucide "sparkles" (lucide.dev, ISC) — the "automatic / magic" baseline.
function MagicIcon() {
  return (
    <svg
      className="magic-icon"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  )
}

// History list with a predecessor graph.
//   single click → set compare   (outlined highlight)
//   double click → set current   (filled highlight)
export default function HistoryPanel({
  versions,
  currentId,
  compareId,
  lockedToPrevious,
  onSetCurrent,
  onSetCompare,
  onToggleLock
}) {
  const listRef = useRef(null)
  const rowRefs = useRef(new Map())
  const prevCount = useRef(versions.length)
  const [layout, setLayout] = useState({ centers: [], height: 0 })

  const handleClick = useClickDebounce(onSetCompare, onSetCurrent)

  // When a new version is added, scroll it into view (no-op if it already fits).
  useEffect(() => {
    if (versions.length > prevCount.current) {
      rowRefs.current.get(currentId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    prevCount.current = versions.length
  }, [versions.length, currentId])

  // Measure row centers (relative to the list) so the graph can draw lines.
  useLayoutEffect(() => {
    const measure = () => {
      const centers = versions.map((v) => {
        const el = rowRefs.current.get(v.id)
        return el ? el.offsetTop + el.offsetHeight / 2 : 0
      })
      const height = listRef.current?.scrollHeight ?? 0
      setLayout({ centers, height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (listRef.current) ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [versions])

  const indexById = useCallback((id) => versions.findIndex((v) => v.id === id), [versions])
  const parentIndex = versions.map((v) => (v.parentId ? indexById(v.parentId) : -1))
  const labelOf = (id) => versions.find((v) => v.id === id)?.label

  // The control is actionable only when there is actually something to compare.
  const canToggle = compareId != null

  return (
    <aside className="history">
      <div className="history-header">History</div>

      <label
        className="history-control"
        title={
          lockedToPrevious
            ? 'Comparing automatically against the previous version (follows as you move around). Flip off to pin a fixed version.'
            : 'Comparing against a fixed, pinned version. Flip on for automatic (previous version).'
        }
      >
        <span className="cmp-label">Comparing</span>
        <span className={`cmp-state ${lockedToPrevious ? 'is-auto' : 'is-pinned'}`}>
          {lockedToPrevious ? <MagicIcon /> : <LockIcon locked />}
          <span className="cmp-value">{lockedToPrevious ? 'Auto' : 'Pinned'}</span>
        </span>
        <Switch
          checked={lockedToPrevious}
          disabled={!canToggle}
          onChange={(on) => onToggleLock(on)}
          ariaLabel="Compare automatically against the previous version"
        />
      </label>

      <div className="history-list" ref={listRef}>
        {versions.length === 0 && <div className="history-empty">No versions yet.</div>}

        <HistoryGraph
          centers={layout.centers}
          parentIndex={parentIndex}
          currentIndex={versions.findIndex((v) => v.id === currentId)}
          compareIndex={versions.findIndex((v) => v.id === compareId)}
          lockedToPrevious={lockedToPrevious}
          height={layout.height}
        />

        {versions.map((v) => {
          const isPinnedCompare = !lockedToPrevious && v.id === compareId
          const cls = [
            'history-item',
            v.id === currentId ? 'is-current' : '',
            v.id === compareId ? 'is-compare' : ''
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div
              key={v.id}
              ref={(el) => {
                if (el) rowRefs.current.set(v.id, el)
                else rowRefs.current.delete(v.id)
              }}
              className={cls}
              style={{ marginLeft: LANE }}
              onClick={() => handleClick(v.id)}
              title="Click to compare · double-click to make current"
            >
              <div className="history-item-top">
                <span className="history-name">
                  {v.label}
                  {isPinnedCompare && (
                    <span className="history-lock" title="Pinned comparison version">
                      <LockIcon locked />
                    </span>
                  )}
                </span>
                <span className="history-time">{v.ts}</span>
              </div>
              <div className="history-sub">
                {v.parentId ? `Parent ${labelOf(v.parentId) ?? '?'}` : 'root'}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
