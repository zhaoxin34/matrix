# Neo Agent Chrome Extension

Chrome Extension (MV3) for Neo Agent AI Platform.

## Features

- **Session Recording**: Record user interactions using rrweb
- **AI Agent Modes**: Learn, Guide, and Active modes
- **Shadow DOM Overlay**: Non-intrusive recording indicator
- **Frontend Integration**: Embedded iframe communication

## Tech Stack

- TypeScript
- Vite 5 + vite-plugin-crx
- Manifest V3
- rrweb for recording
- IndexedDB for storage

## Getting Started

```bash
# Install dependencies
make install

# Build for development (watch mode)
make dev

# Build for production
make build

# Load in Chrome
make load
```

## Manual Installation

1. Run `make build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` directory

## Project Structure

```
chrome-extension/
├── src/
│   ├── manifest.ts        # MV3 manifest configuration
│   ├── background/        # Service Worker
│   ├── content/          # Content Script
│   ├── shared/           # Shared types and utils
│   └── extension/        # Popup and Options UI
├── public/               # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Communication

- **postMessage**: iframe 内外通信
- **BroadcastChannel**: Content Script 与 Service Worker 通信

## Development

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make dev` | Build with watch mode |
| `make build` | Production build |
| `make lint` | Run ESLint |
| `make format` | Format code |
| `make typecheck` | TypeScript check |
| `make clean` | Clean build artifacts |
