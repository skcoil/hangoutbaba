import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { blockIPInRedis, unblockIPInRedis } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const search = searchParams.get('search') || '';

  const [sessions, total] = await Promise.all([
    prisma.anonymousSession.findMany({
      where: search ? { username: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { lastSeen: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, username: true, createdAt: true, lastSeen: true,
        currentRoomId: true, status: true, messageCount: true,
        isBanned: true, bannedAt: true, bannedReason: true,
        currentRoom: { select: { name: true, slug: true } },
      },
    }),
    prisma.anonymousSession.count({ where: search ? { username: { contains: search, mode: 'insensitive' } } : {} }),
  ]);

  return NextResponse.json({ sessions, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { action, sessionId, reason } = body;

  if (!action || !sessionId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const session = await prisma.anonymousSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  if (action === 'ban') {
    await prisma.anonymousSession.update({
      where: { id: sessionId },
      data: { isBanned: true, bannedAt: new Date(), bannedReason: reason || 'Admin action', status: 'BANNED' },
    });
    if (session.ipHash) {
      await blockIPInRedis(session.ipHash, 24 * 60 * 60 * 1000);
    }
    await prisma.adminLog.create({
      data: { adminId: admin.adminId, action: 'BAN_USER', details: `Banned session ${sessionId}: ${reason}` },
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'unban') {
    await prisma.anonymousSession.update({
      where: { id: sessionId },
      data: { isBanned: false, bannedAt: null, bannedReason: null, status: 'ACTIVE' },
    });
    if (session.ipHash) await unblockIPInRedis(session.ipHash);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
