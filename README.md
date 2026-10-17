# HangoutBaba — Anonymous Chat Frontend

A Next.js 14 anonymous chat platform. No signup, no login, just pick a room and talk.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Realtime**: Socket.IO Client
- **UI**: Custom component library (`src/components/ui/`)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout + metadata
│   ├── globals.css                  # Tailwind + custom animations
│   ├── page.tsx                     # Homepage
│   ├── chat/
│   │   └── page.tsx                 # Chat landing (room picker)
│   ├── room/
│   │   └── [slug]/
│   │       └── page.tsx             # Live chat room
│   ├── about/page.tsx
│   ├── privacy/page.tsx
│   └── community-guidelines/page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── Modal.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── chat/
│       ├── ConnectionStatus.tsx
│       ├── TypingIndicator.tsx
│       ├── MessageItem.tsx
│       ├── MessageList.tsx
│       ├── MessageInput.tsx
│       └── RoomSidebar.tsx
├── hooks/
│   ├── useSession.ts                # Session init + username update
│   └── useSocket.ts                 # Socket.IO connection + typed events
└── types/
    └── index.ts                     # Shared TS types + Socket event interfaces
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```env
# URL of the Socket.IO / API server (defaults to same origin)
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## API Routes Expected (Backend)

The frontend calls these REST endpoints (implement separately):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/session` | Create or restore session |
| `PATCH` | `/api/session` | Update username |
| `GET` | `/api/rooms` | List all rooms |
| `GET` | `/api/rooms/:slug` | Get single room by slug |
| `GET` | `/api/messages/:roomId` | Paginated messages (`?cursor=`) |
| `POST` | `/api/report` | Submit message report |

## Socket.IO Events

See `src/types/index.ts` for the full typed event map.

### Server → Client
- `message:new` — new message in joined room
- `message:deleted` — message removed
- `room:count-update` — online user count changed
- `typing:start` / `typing:stop` — typing indicator
- `session:banned` — session was banned

### Client → Server
- `room:join` / `room:leave` — room membership
- `message:send` — send a message
- `message:delete` — delete own message
- `typing:start` / `typing:stop` — broadcast typing state
