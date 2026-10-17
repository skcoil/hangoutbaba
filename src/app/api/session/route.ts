import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { generateUsername, isValidUsername } from '@/lib/username';
import { sanitizeUsername } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashIP, getClientIP } from '@/lib/ip';

// POST /api/session — create or validate anonymous session
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const ipHash = hashIP(ip);

    // Rate limit session creation
    const { allowed } = await checkRateLimit(`session:${ipHash}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const existingSessionId = body?.sessionId as string | undefined;

    // Try to resume existing session
    if (existingSessionId) {
      const session = await prisma.anonymousSession.findUnique({
        where: { id: existingSessionId },
      });
      if (session && !session.isBanned) {
        await prisma.anonymousSession.update({
          where: { id: existingSessionId },
          data: { lastSeen: new Date(), ipHash },
        });
        return NextResponse.json({
          id: session.id,
          username: session.username,
          createdAt: session.createdAt.toISOString(),
          lastSeen: new Date().toISOString(),
          currentRoomId: session.currentRoomId,
        });
      }
    }

    // Create new session
    const username = generateUsername();
    const session = await prisma.anonymousSession.create({
      data: {
        id: uuidv4(),
        username,
        ipHash,
      },
    });

    return NextResponse.json({
      id: session.id,
      username: session.username,
      createdAt: session.createdAt.toISOString(),
      lastSeen: session.lastSeen.toISOString(),
      currentRoomId: session.currentRoomId,
    });
  } catch (error) {
    console.error('[API] Session create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/session — update username
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, username } = body;

    if (!sessionId || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const cleaned = sanitizeUsername(username);
    if (!isValidUsername(cleaned)) {
      return NextResponse.json({ error: 'Invalid username (3-30 alphanumeric characters)' }, { status: 400 });
    }

    const session = await prisma.anonymousSession.findUnique({ where: { id: sessionId } });
    if (!session || session.isBanned) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.anonymousSession.update({
      where: { id: sessionId },
      data: { username: cleaned },
    });

    return NextResponse.json({ username: cleaned });
  } catch (error) {
    console.error('[API] Username update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
