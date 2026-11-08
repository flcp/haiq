use futures_util::future::{AbortHandle, Abortable};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::ipc::Channel;

#[derive(Clone, Default)]
struct GenerationTasks(Arc<Mutex<HashMap<String, AbortHandle>>>);

#[derive(Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateRequest {
    base_url: String,
    api_key: String,
    model: String,
    messages: Vec<Message>,
}

// Streamed back to the webview over a Tauri Channel, one message per event.
#[derive(Serialize, Clone)]
#[serde(tag = "event", rename_all = "camelCase")]
enum StreamEvent {
    Token { content: String },
    Done,
    Error { message: String },
}

// Talk to the LiteLLM / OpenAI-compatible endpoint directly from Rust (no CORS,
// key never touches the webview's network layer). Relay content deltas to the UI.
#[tauri::command]
fn generate(
    request_id: String,
    request: GenerateRequest,
    on_event: Channel<StreamEvent>,
    tasks: tauri::State<'_, GenerationTasks>,
) -> Result<(), String> {
    let active = Arc::clone(&tasks.0);
    let mut handles = active.lock().map_err(|error| error.to_string())?;
    if handles.contains_key(&request_id) {
        return Err("Generation request already exists".into());
    }
    let (handle, registration) = AbortHandle::new_pair();
    handles.insert(request_id.clone(), handle);
    let cleanup = Arc::clone(&active);
    tauri::async_runtime::spawn(async move {
        let _ = Abortable::new(generate_stream(request, on_event), registration).await;
        if let Ok(mut handles) = cleanup.lock() {
            handles.remove(&request_id);
        }
    });
    Ok(())
}

#[tauri::command]
fn cancel_generate(
    request_id: String,
    tasks: tauri::State<'_, GenerationTasks>,
) -> Result<(), String> {
    let mut handles = tasks.0.lock().map_err(|error| error.to_string())?;
    if let Some(handle) = handles.remove(&request_id) {
        handle.abort();
    }
    Ok(())
}

async fn generate_stream(request: GenerateRequest, on_event: Channel<StreamEvent>) -> Result<(), String> {
    let url = format!(
        "{}/v1/chat/completions",
        request.base_url.trim_end_matches('/')
    );

    let body = serde_json::json!({
        "model": request.model,
        "stream": true,
        "messages": request.messages.iter()
            .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
            .collect::<Vec<_>>(),
    });

    let resp = match reqwest::Client::new()
        .post(&url)
        .header("Authorization", format!("Bearer {}", request.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let _ = on_event.send(StreamEvent::Error {
                message: format!("Could not reach LLM at {url}: {e}"),
            });
            return Ok(());
        }
    };

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        let _ = on_event.send(StreamEvent::Error {
            message: format!(
                "LLM returned {status}: {}",
                text.chars().take(500).collect::<String>()
            ),
        });
        return Ok(());
    }

    // Parse the SSE stream, buffering partial lines across chunks.
    let mut stream = resp.bytes_stream();
    let mut buf = String::new();
    while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
            Ok(c) => c,
            Err(e) => {
                let _ = on_event.send(StreamEvent::Error {
                    message: format!("stream error: {e}"),
                });
                return Ok(());
            }
        };
        buf.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buf.find('\n') {
            let line: String = buf[..pos].trim().to_string();
            buf.drain(..=pos);
            let Some(payload) = line.strip_prefix("data:") else {
                continue;
            };
            let payload = payload.trim();
            if payload == "[DONE]" {
                let _ = on_event.send(StreamEvent::Done);
                return Ok(());
            }
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(payload) {
                if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                    if !content.is_empty() {
                        let _ = on_event.send(StreamEvent::Token {
                            content: content.to_string(),
                        });
                    }
                }
            }
        }
    }

    let _ = on_event.send(StreamEvent::Done);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GenerationTasks::default())
        .invoke_handler(tauri::generate_handler![generate, cancel_generate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
