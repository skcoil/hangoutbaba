'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RoomData } from '@/types';
import { DEFAULT_ROOMS } from '@/lib/defaultRooms';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { generateSlug } from '@/lib/titleGenerator';

export function useRooms() {
  const [customRooms, setCustomRooms] = useState<RoomData[]>([]);
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  const [onlineUserCount, setOnlineUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    setLoading(true);

    // 1. Listen for custom rooms
    const roomsColRef = collection(db, 'rooms');
    const unsubscribeRooms = onSnapshot(
      roomsColRef,
      (snapshot) => {
        const loaded: RoomData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const slug = data.slug || docSnap.id;
          if (!DEFAULT_ROOMS.some((r) => r.slug === slug)) {
            loaded.push({
              id: docSnap.id,
              slug,
              name: data.name || slug,
              category: data.category || 'general',
              description: data.description || '',
              isDefault: false,
              activeUserCount: 0,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            });
          }
        });
        setCustomRooms(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('[useRooms] Error listening to rooms:', error);
        setLoading(false);
      }
    );

    // 2. Listen for global user presence to calculate real-time room counts accurately
    const presenceColRef = collection(db, 'presence');
    const unsubscribePresence = onSnapshot(
      presenceColRef,
      (snapshot) => {
        const now = Date.now();
        const counts: Record<string, number> = {};
        const activeUsers = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // User is active if heartbeat was within last 35 seconds and assigned to a room
          if (data.updatedAt && now - data.updatedAt < 35000 && data.currentRoom) {
            counts[data.currentRoom] = (counts[data.currentRoom] || 0) + 1;
            activeUsers.add(data.sessionId || docSnap.id);
          }
        });

        setPresenceCounts(counts);
        setOnlineUserCount(activeUsers.size);
      },
      (error) => {
        console.error('[useRooms] Error listening to presence:', error);
      }
    );

    return () => {
      unsubscribeRooms();
      unsubscribePresence();
    };
  }, []);

  // Merge default rooms and custom rooms with their LIVE presence count
  const rooms: RoomData[] = useMemo(() => {
    const all = [...DEFAULT_ROOMS, ...customRooms];
    return all.map((r) => ({
      ...r,
      activeUserCount: presenceCounts[r.slug] || 0,
    }));
  }, [customRooms, presenceCounts]);

  // Top trending rooms sorted strictly by active users
  const trendingRooms = useMemo(() => {
    return [...rooms].sort((a, b) => b.activeUserCount - a.activeUserCount);
  }, [rooms]);

  const totalOnlineUsers = onlineUserCount;

  const createRoom = useCallback(
    async (name: string, category = 'general', description = '') => {
      const trimmedName = name.trim();
      if (!trimmedName) return null;

      let slug = generateSlug(trimmedName);
      if (!slug) {
        slug = `room-${Date.now().toString(36)}`;
      }

      const newRoom: RoomData = {
        id: slug,
        slug,
        name: trimmedName,
        category,
        description,
        isDefault: false,
        activeUserCount: 1,
        createdAt: new Date().toISOString(),
      };

      setCustomRooms((prev) => {
        if (prev.some((r) => r.slug === slug)) return prev;
        return [newRoom, ...prev];
      });

      if (isFirebaseConfigured) {
        try {
          const roomDocRef = doc(db, 'rooms', slug);
          await setDoc(
            roomDocRef,
            {
              name: trimmedName,
              slug,
              category,
              description,
              isDefault: false,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.error('[useRooms] Failed to save room in Firestore:', err);
        }
      }

      return slug;
    },
    []
  );

  return { rooms, trendingRooms, totalOnlineUsers, loading, createRoom };
}
