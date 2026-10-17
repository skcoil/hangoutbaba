'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SessionData, ServerToClientEvents, ClientToServerEvents } from '@/types';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useSocket(session: SessionData | null) {
  const socketRef = useRef<AppSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (!session) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    setStatus('connecting');

    const socket: AppSocket = io(wsUrl, {
      auth: { sessionId: session.id, username: session.username },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));
    socket.io.on('reconnect', () => setStatus('connected'));
    socket.io.on('reconnect_attempt', () => setStatus('connecting'));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setStatus('disconnected');
    };
  }, [session?.id]);

  const joinRoom = useCallback((slug: string) => {
    socketRef.current?.emit('room:join', slug);
  }, []);

  const leaveRoom = useCallback((slug: string) => {
    socketRef.current?.emit('room:leave', slug);
  }, []);

  const sendMessage = useCallback((roomSlug: string, content: string) => {
    socketRef.current?.emit('message:send', { roomSlug, content });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('message:delete', messageId);
  }, []);

  const startTyping = useCallback((roomSlug: string) => {
    socketRef.current?.emit('typing:start', roomSlug);
  }, []);

  const stopTyping = useCallback((roomSlug: string) => {
    socketRef.current?.emit('typing:stop', roomSlug);
  }, []);

  return {
    socket: socketRef.current,
    status,
    joinRoom,
    leaveRoom,
    sendMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  };
}
