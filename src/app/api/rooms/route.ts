import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { generateRoomTitle, generateSlug } from '@/lib/titleGenerator';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashIP, getClientIP } from '@/lib/ip';

// GET /api/rooms — list all active rooms
export async function GET(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany({
      where: { isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { lastActivity: 'desc' }],
      take: 50,
    });

    // Get live counts from Redis
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const redisCount = await redis.get(`room:count:${room.slug}`).catch(() => null);
        const liveCount = redisCount ? parseInt(redisCount, 10) : 0;
        return {
          id: room.id,
          name: room.name,
          slug: room.slug,
          description: room.description,
          category: room.category,
          activeUserCount: liveCount,
          messageCount: room.messageCount,
          lastActivity: room.lastActivity.toISOString(),
          isDefault: room.isDefault,
        };
      })
    );

    return NextResponse.json(roomsWithCounts);
  } catch (error) {
    console.error('[API] Rooms list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rooms — create new room
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed } = await checkRateLimit(`room:create:${hashIP(ip)}`, 3, 60000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many rooms created recently' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { firstMessage, sessionId } = body;

    if (!firstMessage || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const name = generateRoomTitle([firstMessage]);
    let slug = generateSlug(name);

    // Ensure unique slug
    const existing = await prisma.room.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const room = await prisma.room.create({
      data: { name, slug, isDefault: false },
    });

    return NextResponse.json({
      id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      category: room.category,
      activeUserCount: 0,
      messageCount: 0,
      lastActivity: room.lastActivity.toISOString(),
      isDefault: room.isDefault,
    });
  } catch (error) {
    console.error('[API] Room create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
