import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      orderBy: { lastActivity: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.room.count(),
  ]);

  return NextResponse.json({
    rooms: rooms.map((r) => ({ ...r, lastActivity: r.lastActivity.toISOString(), createdAt: r.createdAt.toISOString() })),
    total, page, pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { action, roomId } = body;

  if (!action || !roomId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  if (action === 'archive') {
    await prisma.room.update({ where: { id: roomId }, data: { isArchived: true } });
    await prisma.adminLog.create({ data: { adminId: admin.adminId, action: 'ARCHIVE_ROOM', details: `Archived room ${roomId}` } });
    return NextResponse.json({ success: true });
  }

  if (action === 'unarchive') {
    await prisma.room.update({ where: { id: roomId }, data: { isArchived: false } });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    await prisma.message.deleteMany({ where: { roomId } });
    await prisma.room.delete({ where: { id: roomId } });
    await prisma.adminLog.create({ data: { adminId: admin.adminId, action: 'DELETE_ROOM', details: `Deleted room ${roomId}` } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
