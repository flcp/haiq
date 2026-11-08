// SVG overlay for the history: a node marker centred on each version and plain
// connecting lines to each version's predecessor. Adjacent versions connect
// with a straight segment; a rollback branch connects with a line that bows
// out to the left. No arrowheads.

const LANE = 30
const AX = LANE / 2 // node / line x position within the lane
const R = 4.5 // node half-size

function diamond(cx, cy, r) {
  return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`
}

export default function HistoryGraph({ centers, parentIndex, currentIndex, compareIndex, lockedToPrevious, height }) {
  if (!centers.length) return null

  return (
    <svg className="history-graph" width={LANE} height={height} aria-hidden="true">
      {/* connecting lines (drawn first, behind the nodes) */}
      {centers.map((childY, i) => {
        const p = parentIndex[i]
        if (p == null || p < 0) return null
        const parentY = centers[p]
        const span = i - p
        const d =
          span === 1
            ? `M ${AX} ${childY} L ${AX} ${parentY}`
            : `M ${AX} ${childY} C ${AX - Math.min(4 + (span - 1) * 8, AX)} ${childY}, ` +
              `${AX - Math.min(4 + (span - 1) * 8, AX)} ${parentY}, ${AX} ${parentY}`
        // In auto mode the compared version is the current's parent: highlight
        // that edge so it reads as "these two are being compared".
        const isCompareEdge = lockedToPrevious && i === currentIndex && p === compareIndex
        return (
          <path
            key={`e${i}`}
            d={d}
            className={isCompareEdge ? 'history-edge is-compare-edge' : 'history-edge'}
            fill="none"
          />
        )
      })}

      {/* version nodes */}
      {centers.map((cy, i) => {
        const cls =
          i === currentIndex
            ? 'history-node is-current'
            : i === compareIndex
              ? 'history-node is-compare'
              : 'history-node'
        return <path key={`n${i}`} d={diamond(AX, cy, R)} className={cls} />
      })}
    </svg>
  )
}

export { LANE }
