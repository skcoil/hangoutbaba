// ============================================================
// Shared TypeScript types for HangoutBaba frontend
// ============================================================

// ----- Session -----
export interface SessionData {
  id: string;
  username: string;
  createdAt: string;
  isBanned: boolean;
}

// ----- Room -----
export interface RoomData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  isDefault: boolean;
  activeUserCount: number;
  createdAt: string;
}

// ----- Message -----
export interface MessageData {
  id: string;
  roomId: string;
  sessionId: string;
  username: string;
  content: string;
  createdAt: string;
  isDeleted?: boolean;
}

// ----- Report -----
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_ABUSE'
  | 'SEXUAL_CONTENT'
  | 'ILLEGAL_CONTENT'
  | 'SCAM'
  | 'OTHER';

export interface ReportPayload {
  messageId: string;
  reporterId: string;
  reason: ReportReason;
}

// ============================================================
// Socket.IO typed events
// ============================================================

/** Events the SERVER emits to the CLIENT */
export interface ServerToClientEvents {
  'message:new': (message: MessageData) => void;
  'message:deleted': (messageId: string) => void;
  'room:count-update': (count: number) => void;
  'typing:start': (username: string) => void;
  'typing:stop': (username: string) => void;
  'session:banned': () => void;
  'error': (error: { code: string; message: string }) => void;
}

/** Events the CLIENT emits to the SERVER */
export interface ClientToServerEvents {
  'room:join': (slug: string) => void;
  'room:leave': (slug: string) => void;
  'message:send': (payload: { roomSlug: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'typing:start': (roomSlug: string) => void;
  'typing:stop': (roomSlug: string) => void;
}

// ============================================================
// API response shapes
// ============================================================

export interface PaginatedMessages {
  messages: MessageData[];
  nextCursor: string | null;
}

export interface ApiError {
  error: string;
  code?: string;
}
