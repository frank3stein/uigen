# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run setup        # Install deps + Prisma generate + migrate
npm run db:reset     # Reset SQLite database
```

`NODE_OPTIONS='--require ./node-compat.cjs'` is prepended to all scripts for Node compatibility shims.

## Architecture

UIGen is a Next.js 15 (App Router) application that generates React components via Claude AI and previews them live in the browser. All generated code lives in an **in-memory virtual file system** — nothing is written to disk.

### Core Data Flow

```
User chat message
  → POST /api/chat (with serialized file system state)
  → Claude streams response with tool calls (str_replace_editor, file_manager)
  → FileSystemContext applies tool results to in-memory VFS
  → jsx-transformer Babel-transpiles files → HTML with esm.sh import map
  → Sandboxed iframe renders live preview
  → If authenticated: messages + files persisted to SQLite (Prisma)
```

### Key Modules

| Path | Role |
|------|------|
| `src/lib/file-system.ts` | In-memory file tree (Map-based). All file CRUD and text-editor commands (`str_replace`, `view`, `insert`). No disk I/O. |
| `src/lib/contexts/file-system-context.tsx` | React Context wrapping VirtualFileSystem; handles tool-call results from AI. |
| `src/lib/contexts/chat-context.tsx` | Chat state, streams AI responses, routes tool calls. |
| `src/app/api/chat/route.ts` | Streaming AI endpoint. Receives `messages`, serialized `files`, optional `projectId`. Persists to DB for authenticated users. |
| `src/lib/transform/jsx-transformer.ts` | Babel JSX → JS transpilation, import map generation (esm.sh CDN), produces full HTML for iframe preview. |
| `src/lib/provider.ts` | Returns Claude model (`claude-haiku-4-5`) via `@ai-sdk/anthropic`, or a mock provider if `ANTHROPIC_API_KEY` is absent. |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude with `cacheControl` for token efficiency. |
| `src/lib/auth.ts` | JWT creation/verification; 7-day cookie sessions. |
| `src/middleware.ts` | Protects `/api/projects/*`, `/api/filesystem/*` routes via JWT. |
| `src/actions/index.ts` | Server Actions for auth (signUp, signIn, signOut) and project CRUD. |
| `prisma/schema.prisma` | SQLite schema: `User` and `Project` (messages + file data stored as JSON). |

### AI Tool Interface

Claude interacts with the virtual file system through two tools defined under `src/lib/tools/`:
- **`str_replace_editor`** — create and edit files (view, str_replace, create, insert commands)
- **`file_manager`** — rename and delete files

### Preview Pipeline

Files in the VFS → Babel transpilation (JSX + TypeScript) → `<script type="module">` tags with an import map pointing React/ReactDOM to `esm.sh` CDN → injected into a sandboxed `<iframe>`.

### Authentication

Cookie-based JWT sessions. Unauthenticated users can use the app fully; their file system and chat history are ephemeral (memory only). Authenticated users get project persistence.

### Environment

- `ANTHROPIC_API_KEY` — required for real AI generation; falls back to mock static component if absent.
- Database: SQLite at `prisma/dev.db` (auto-created by `npm run setup`).

### Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`).
