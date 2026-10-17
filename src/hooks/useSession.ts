'use client';
import { useState, useEffect, useCallback } from 'react';
import { SessionData } from '@/types';
import { generateUsername, isValidUsername } from '@/lib/username';
import { sanitizeUsername } from '@/lib/sanitize';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'hb_session';

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  function initSession() {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.username) {
          setSession(parsed);
          setLoading(false);
          return;
        }
      }

      // Generate a new anonymous session locally
      const newSession: SessionData = {
        id: uuidv4(),
        username: generateUsername(),
        createdAt: new Date().toISOString(),
        isBanned: false,
      };

      setSession(newSession);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      }
    } catch (err) {
      console.error('[useSession] Local session error:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateUsername = useCallback(async (newUsername: string) => {
    if (!session) return false;
    const cleaned = sanitizeUsername(newUsername);
    if (!isValidUsername(cleaned)) return false;

    const updated: SessionData = { ...session, username: cleaned };
    setSession(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
    return true;
  }, [session]);

  return { session, loading, updateUsername, refreshSession: initSession };
}
