'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SessionData, MessageData } from '@/types';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { sanitizeMessage } from '@/lib/sanitize';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useSocket(session: SessionData | null) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const currentRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) {
      setStatus('disconnected');
      return;
    }
    setStatus('connected');
  }, [session]);

  const joinRoom = useCallback(
    (slug: string) => {
      if (!session || !slug) return;
      currentRoomRef.current = slug;

      if (!isFirebaseConfigured) {
        setOnlineCount(1);
        setStatus('connected');
        return () => {};
      }

      setStatus('connected');

      // 1. Listen for real-time messages in this room
      const messagesRef = collection(db, 'rooms', slug, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

      const unsubscribeMessages = onSnapshot(
        q,
        (snapshot) => {
          const loaded: MessageData[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.isDeleted) {
              let createdAt = new Date().toISOString();
              if (data.createdAt?.toDate) {
                createdAt = data.createdAt.toDate().toISOString();
              } else if (typeof data.createdAt === 'string') {
                createdAt = data.createdAt;
              }

              loaded.push({
                id: docSnap.id,
                roomId: slug,
                sessionId: data.sessionId || '',
                username: data.username || 'Anonymous',
                content: data.content || '',
                createdAt,
              });
            }
          });
          setMessages(loaded);
          setStatus('connected');
        },
        (error) => {
          console.error('[Firebase Chat] Message listener error:', error);
        }
      );

      // 2. Global single-document presence per user: presence/{sessionId}
      const userPresenceDocRef = doc(db, 'presence', session.id);
      const updatePresence = (typing = false) => {
        setDoc(
          userPresenceDocRef,
          {
            sessionId: session.id,
            username: session.username,
            currentRoom: slug,
            typing,
            updatedAt: Date.now(),
          },
          { merge: true }
        ).catch(() => {});
      };

      // Set initial presence in this room
      updatePresence(false);
      const presenceInterval = setInterval(() => updatePresence(false), 15000);

      // Listen for presence in this specific room only
      const qPresence = query(collection(db, 'presence'), where('currentRoom', '==', slug));
      const unsubscribePresence = onSnapshot(
        qPresence,
        (snapshot) => {
          const now = Date.now();
          const active: string[] = [];
          const typing: string[] = [];

          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            // Active if heartbeat was within last 35 seconds
            if (d.updatedAt && now - d.updatedAt < 35000) {
              active.push(d.sessionId || docSnap.id);
              if (d.typing && d.sessionId !== session.id) {
                typing.push(d.username || 'Anonymous');
              }
            }
          });

          // Always show at least 1 (the current user)
          setOnlineCount(Math.max(1, active.length));
          setTypingUsers(typing);
        },
        (error) => {
          console.error('[Firebase Chat] Presence listener error:', error);
        }
      );

      return () => {
        unsubscribeMessages();
        unsubscribePresence();
        clearInterval(presenceInterval);
        // Leaving room: set currentRoom to null so user is never stuck in this room
        setDoc(
          userPresenceDocRef,
          {
            currentRoom: null,
            typing: false,
            updatedAt: Date.now(),
          },
          { merge: true }
        ).catch(() => {});
      };
    },
    [session]
  );

  const leaveRoom = useCallback(
    (slug: string) => {
      if (!session || !isFirebaseConfigured) return;
      const userPresenceDocRef = doc(db, 'presence', session.id);
      setDoc(
        userPresenceDocRef,
        {
          currentRoom: null,
          typing: false,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
    },
    [session]
  );

  const sendMessage = useCallback(
    async (roomSlug: string, content: string) => {
      if (!session) return;
      const cleanText = sanitizeMessage(content).slice(0, 500);
      if (!cleanText) return;

      // Optimistic local update for zero-latency feedback
      const tempId = `temp-${Date.now()}`;
      const tempMsg: MessageData = {
        id: tempId,
        roomId: roomSlug,
        sessionId: session.id,
        username: session.username,
        content: cleanText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);

      if (!isFirebaseConfigured) {
        return;
      }

      try {
        const messagesRef = collection(db, 'rooms', roomSlug, 'messages');
        await addDoc(messagesRef, {
          sessionId: session.id,
          username: session.username,
          content: cleanText,
          createdAt: serverTimestamp(),
          isDeleted: false,
        });

        // Reset typing indicator upon message sent
        const userPresenceDocRef = doc(db, 'presence', session.id);
        setDoc(userPresenceDocRef, { typing: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      } catch (err) {
        console.error('[Firebase Chat] Send message failed:', err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [session]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!session) return;
      const slug = currentRoomRef.current;
      if (!slug) return;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      if (!isFirebaseConfigured) return;

      try {
        const msgDocRef = doc(db, 'rooms', slug, 'messages', messageId);
        await updateDoc(msgDocRef, { isDeleted: true });
      } catch (err) {
        console.error('[Firebase Chat] Delete message failed:', err);
      }
    },
    [session]
  );

  const startTyping = useCallback(
    (roomSlug: string) => {
      if (!session || !isFirebaseConfigured) return;
      const userPresenceDocRef = doc(db, 'presence', session.id);
      setDoc(userPresenceDocRef, { typing: true, updatedAt: Date.now() }, { merge: true }).catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(userPresenceDocRef, { typing: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }, 3000);
    },
    [session]
  );

  const stopTyping = useCallback(
    (roomSlug: string) => {
      if (!session || !isFirebaseConfigured) return;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const userPresenceDocRef = doc(db, 'presence', session.id);
      setDoc(userPresenceDocRef, { typing: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    },
    [session]
  );

  return {
    socket: null,
    status,
    messages,
    typingUsers,
    onlineCount,
    joinRoom,
    leaveRoom,
    sendMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  };
}
