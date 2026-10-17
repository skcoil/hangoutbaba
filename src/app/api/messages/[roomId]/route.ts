import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.roomId,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        session: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formatted = messages.reverse().map((m) => ({
      id: m.id,
      roomId: m.roomId,
      sessionId: m.sessionId,
      username: m.session.username,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    const nextCursor = messages.length === limit ? messages[0]?.createdAt.toISOString() : null;

    return NextResponse.json({ messages: formatted, nextCursor });
  } catch (error) {
    console.error('[API] Messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
