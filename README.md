<div align="center">

```
     ┌─────────────┐
  ╔══╧═════════════╧══╗
  ║  ◉           ◉  ║
  ║       ───       ║
  ╚═════════════════╝
```

# RoboChat

**Intelligent AI chatbot interface built for human-robot interaction**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Venice AI](https://img.shields.io/badge/Powered%20by-Venice%20AI-7C3AED)](https://venice.ai)

[Features](#features) &nbsp;•&nbsp; [Quick Start](#quick-start) &nbsp;•&nbsp; [Architecture](#architecture) &nbsp;•&nbsp; [Commands](#robot-commands) &nbsp;•&nbsp; [Configuration](#configuration) &nbsp;•&nbsp; [Development](#development)

</div>

---

## Demo

<div align="center">

![RoboChat Demo](docs/demo/chat-demo.gif)

*RoboChat streams AI responses in real-time, executes robot commands, and visualizes the surrounding environment with a live radar scan*

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| **Streaming chat** | Real-time token streaming from Venice AI via Server-Sent Events |
| **Robot persona** | RoboChat responds in-character as a physical robot with personality |
| **Robot commands** | LLM emits embedded commands (`wave`, `dance`, `move_forward`…) that animate the UI |
| **Animated avatar** | SVG robot face transitions through idle / listening / thinking / speaking / executing states |
| **Voice I/O** | Speak via Web Speech API; responses are read aloud with text-to-speech |
| **Conversation memory** | Multi-session history persisted in SQLite, survives container restarts |
| **One-command setup** | `docker compose up --build` launches the full stack |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://docker.com/products/docker-desktop) or Docker Engine + Compose v2
- A Venice AI API key — get one at [venice.ai](https://venice.ai)

### Run

```bash
git clone https://github.com/expertdicer/robochat.git
cd robochat

cp .env.example .env
# Open .env and set VENICE_API_KEY=your_key_here

docker compose up --build
```

Open **[http://localhost:3000](http://localhost:3000)** — RoboChat is ready.

---

## Architecture

```
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────┐
│  frontend            │         │  backend              │         │  Venice AI   │
│  Next.js 14 + TS     │ ◄─SSE─► │  FastAPI + Python 3.12│ ─HTTPS► │  /v1/chat/   │
│  Tailwind CSS        │  REST   │  SQLModel + SQLite    │         │  completions │
│  Zustand + framer    │         │  EventBus (SSE pubsub)│         └──────────────┘
│  Web Speech API      │         │                       │
└──────────────────────┘         └──────────────────────┘
        :3000                             :8000
```

**Data flow for a chat message:**

1. User types (or speaks) a message in the frontend
2. `POST /chat/stream` is called — FastAPI starts streaming SSE
3. Backend sends the conversation history + system prompt to Venice AI
4. As tokens arrive, command tags (`[[cmd:wave]]`) are extracted and emitted as separate SSE events
5. The frontend renders tokens in real-time, animates the robot avatar, and updates the command panel
6. On stream end, the assistant message is persisted to SQLite

---

## Robot Commands

RoboChat can issue physical robot commands during conversation. The LLM embeds them as `[[cmd:NAME]]` tags that are parsed server-side and forwarded to the UI as dedicated SSE events.

| Command | Description |
|---------|-------------|
| `wave` | Wave at the human |
| `dance` | Perform a celebratory dance |
| `move_forward` / `move_back` | Move one step forward or backward |
| `turn_left` / `turn_right` | Rotate 90 degrees |
| `pick_up` / `put_down` | Manipulate nearby objects |
| `scan` | Scan the surrounding environment |
| `charge` | Initiate charging sequence |
| `sleep` / `wake` | Transition power states |
| `report` | Generate a status report |

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VENICE_API_KEY` | — | **Required.** Your Venice AI API key |
| `VENICE_MODEL` | `llama-3.3-70b` | Model to use for completions |
| `VENICE_BASE_URL` | `https://api.venice.ai/api/v1` | Venice API base URL |
| `DB_PATH` | `/data/robochat.db` | SQLite database path (inside container) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins (comma-separated) |

---

## Development

### Backend

```bash
cd backend
pip install uv
uv pip install --system -e ".[dev]"
cp ../.env.example ../.env  # set VENICE_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local already points to http://localhost:8000
npm run dev
```

### Tests

```bash
cd backend
pytest -v
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | [TypeScript 5](https://typescriptlang.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| State management | [Zustand 4](https://github.com/pmndrs/zustand) |
| Animation | [Framer Motion 11](https://framer-motion.com) |
| Backend framework | [FastAPI](https://fastapi.tiangolo.com) |
| Backend language | [Python 3.12](https://python.org) |
| ORM / DB | [SQLModel](https://sqlmodel.tiangolo.com) + SQLite |
| LLM provider | [Venice AI](https://venice.ai) (OpenAI-compatible API) |
| Voice | Web Speech API (browser-native) |
| Container | Docker + Docker Compose |

---

## License

MIT © 2025 — see [LICENSE](LICENSE) for details.
