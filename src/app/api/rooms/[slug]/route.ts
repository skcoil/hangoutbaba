import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const room = await prisma.room.findUnique({ where: { slug: params.slug } });
    if (!room || room.isArchived) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const redisCount = await redis.get(`room:count:${room.slug}`).catch(() => null);
    const liveCount = redisCount ? parseInt(redisCount, 10) : 0;

    return NextResponse.json({
      id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      category: room.category,
      activeUserCount: liveCount,
      messageCount: room.messageCount,
      lastActivity: room.lastActivity.toISOString(),
      isDefault: room.isDefault,
    });
  } catch (error) {
    console.error('[API] Room get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
