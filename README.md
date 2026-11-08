# haiq

Iterative AI assisted writing as a **native macOS app**. Easy version rollback and comparisons.
Can be used with any LiteLLM proxy.

## Architecture

- **Frontend** — React (Vite) running in WebView. Contains the whole view and application logic apart from the connection to the LLM.
- **Backend** — Rust/Tauri app that hosts the frontend and connects to LiteLLM endpoint, avoiding CORS issues.

Rust handles HTTP requests to avoid WebView CORS restrictions.
API key never touches the WebView's network layer.

It's distributed as a single macOS app bundle.

## Requirements

To run the app, no additional software is required.

## Tested development environment

- **Rust** (stable): rustc 1.99.1
- **Node**: v20.13.1
- **Xcode Command Line Tools or Xcode**

## Configure

On first run, open **⚙ Settings** and enter:

- **Endpoint base URL** — e.g. `http://localhost:6655/litellm` (haiq calls
  `{base}/v1/chat/completions`)
- **API key**
- **Model**

Settings are stored in localStorage.

## Developer information

### Run and watch

```bash
npm install
npm run tauri:dev
```

### Build

```bash
npm run tauri:build
```

Output in `src-tauri/target/release/bundle/`, e.g.:

- `macos/haiq.app` — the application bundle (the executable is inside at
  `Contents/MacOS/haiq`)
- `dmg/haiq_2.0.0_aarch64.dmg` — a draggable installer for Apple Silicon

## App icon

`npm run icon` regenerates the icon set (`src-tauri/icons/*`, including the macOS
`icon.icns`) from `appicon.svg`.

To change icons, edit
`appicon.svg` and re-run.
