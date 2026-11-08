// Pure data helpers for versions and lineage. No React, no side effects.

let seq = 0
function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${++seq}`
}

export function formatTimestamp(d = new Date()) {
  return d.toLocaleString('de-DE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// A version is an immutable snapshot that knows its predecessor (parentId).
export function makeVersion({ text, source, parentId, n }) {
  return {
    id: uid(),
    n,
    label: `v${n}`,
    text,
    source, // 'prompt' | 'edit'
    parentId: parentId ?? null,
    ts: formatTimestamp()
  }
}

export function getVersion(versions, id) {
  return versions.find((v) => v.id === id) ?? null
}

export function predecessorId(versions, id) {
  return getVersion(versions, id)?.parentId ?? null
}

export function nextNumber(versions) {
  return versions.reduce((max, v) => Math.max(max, v.n), 0) + 1
}
