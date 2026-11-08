// Prompt construction and the document/comment split convention.
// This module owns the "contract" with the model; swap it to change behaviour.

export const COMMENT_MARKER = '---COMMENT---'

export const SYSTEM_PROMPT = [
  'You are a collaborative writing assistant for a single evolving document.',
  'Always reply with the COMPLETE updated document text — not a diff, not a snippet,',
  'and never wrapped in markdown code fences or prefaced with "Here is...".',
  `If you want to add a comment or ask for clarification, put it AFTER a line containing`,
  `exactly "${COMMENT_MARKER}". Everything before the marker is the document; everything`,
  'after it is your comment. Omit the marker entirely when you have no comment.'
].join(' ')

// Split a model reply into the document body and an optional trailing comment.
export function splitDocComment(raw) {
  const i = raw.indexOf(COMMENT_MARKER)
  if (i === -1) return { text: raw, comment: '' }
  return {
    text: raw.slice(0, i).replace(/\n+$/, ''),
    comment: raw.slice(i + COMMENT_MARKER.length).replace(/^\n+/, '')
  }
}

// Build the OpenAI-style messages for one generation.
//   document    current document text (may be empty on the first prompt)
//   instruction the user's prompt
//   quote       optional selected excerpt the instruction should target
export function buildMessages({ document, instruction, quote }) {
  const parts = []
  if (document.trim()) parts.push(`Current document:\n"""\n${document}\n"""`)
  if (quote && quote.trim()) {
    parts.push(
      `Apply the instruction ONLY to this excerpt and return the full document with ` +
        `the rest left exactly as it is:\n"""\n${quote}\n"""`
    )
  }
  parts.push(`Instruction: ${instruction}`)

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: document.trim() || quote ? parts.join('\n\n') : instruction }
  ]
}
