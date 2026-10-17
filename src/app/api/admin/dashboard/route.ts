import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [totalSessions, activeRooms, blockedIPs, pendingReports, recentMessages] = await Promise.all([
      prisma.anonymousSession.count({ where: { status: 'ACTIVE' } }),
      prisma.room.count({ where: { isArchived: false } }),
      prisma.blockedIP.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.message.count({ where: { createdAt: { gte: new Date(Date.now() - 60000) } } }),
    ]);

    const rooms = await prisma.room.findMany({
      where: { isArchived: false },
      orderBy: { lastActivity: 'desc' },
      take: 10,
      select: { name: true, slug: true, activeUserCount: true, messageCount: true, lastActivity: true },
    });

    // Get live online count from Redis
    let onlineCount = 0;
    const roomKeys = await redis.keys('room:count:*').catch(() => []);
    for (const key of roomKeys) {
      const val = await redis.get(key).catch(() => '0');
      onlineCount += parseInt(val || '0', 10);
    }

    return NextResponse.json({
      onlineUsers: onlineCount,
      totalSessions,
      activeRooms,
      blockedIPs,
      pendingReports,
      messagesPerMinute: recentMessages,
      recentRooms: rooms.map((r) => ({
        ...r,
        lastActivity: r.lastActivity.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Admin] Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
