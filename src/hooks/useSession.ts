'use client';
import { useState, useEffect, useCallback } from 'react';
import { SessionData } from '@/types';

const SESSION_KEY = 'hb_session';

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  async function initSession() {
    setLoading(true);
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      const existingId = stored ? JSON.parse(stored)?.id : null;

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: existingId }),
      });

      if (res.ok) {
        const data: SessionData = await res.json();
        setSession(data);
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('[useSession] Failed to init session:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateUsername = useCallback(async (newUsername: string) => {
    if (!session) return false;
    try {
      const res = await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, username: newUsername }),
      });
      if (res.ok) {
        const updated = { ...session, username: newUsername };
        setSession(updated);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        return true;
      }
    } catch {}
    return false;
  }, [session]);

  return { session, loading, updateUsername, refreshSession: initSession };
}
