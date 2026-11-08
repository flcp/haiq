// LLM transport for the Tauri app. The actual HTTP request happens in Rust
// (no CORS, key never touches the webview's network layer); Rust streams content
// deltas back over a Channel. We still do the SSE accumulation + comment split here.

import { invoke, Channel } from '@tauri-apps/api/core'
import { splitDocComment } from './messages.js'

/**
 * Stream a generation via the Rust `generate` command.
 *
 * @param {Array}  messages  OpenAI-style messages.
 * @param {object} handlers  { onText, onComment, onDone, onError }
 * @param {object} opts       { config: { baseUrl, apiKey, model } }
 * @returns {{ cancel: () => void }}
 */
export function streamGenerate(messages, handlers = {}, opts = {}) {
  const { onText, onComment, onDone, onError } = handlers
  const { baseUrl, apiKey, model } = opts.config || {}
  const requestId = crypto.randomUUID()

  let full = ''
  let lastText
  let lastComment
  let cancelled = false
  let finished = false

  const emit = () => {
    const { text, comment } = splitDocComment(full)
    if (text !== lastText) {
      lastText = text
      onText?.(text)
    }
    if (comment !== lastComment) {
      lastComment = comment
      onComment?.(comment)
    }
  }

  const channel = new Channel()
  channel.onmessage = (msg) => {
    if (cancelled || finished) return
    if (msg.event === 'token') {
      full += msg.content
      emit()
    } else if (msg.event === 'done') {
      finished = true
      emit()
      onDone?.(splitDocComment(full))
    } else if (msg.event === 'error') {
      finished = true
      onError?.(new Error(msg.message))
    }
  }

  const started = invoke('generate', {
    requestId,
    request: { baseUrl, apiKey, model, messages },
    onEvent: channel
  })
  started.catch((e) => {
    if (!cancelled && !finished) {
      finished = true
      onError?.(new Error(typeof e === 'string' ? e : e?.message || 'Request failed'))
    }
  })

  return {
    cancel: () => {
      if (cancelled || finished) return
      cancelled = true
      started.then(() => invoke('cancel_generate', { requestId })).catch(() => {})
    }
  }
}
