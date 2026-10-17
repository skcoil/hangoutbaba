import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashIP, getClientIP } from '@/lib/ip';

const VALID_REASONS = [
  'SPAM', 'HARASSMENT', 'HATE_ABUSE', 'SEXUAL_CONTENT',
  'ILLEGAL_CONTENT', 'SCAM', 'OTHER',
];

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed } = await checkRateLimit(`report:${hashIP(ip)}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many reports submitted' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { messageId, reporterId, reason, description } = body;

    if (!messageId || !reporterId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { session: true },
    });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const reporter = await prisma.anonymousSession.findUnique({ where: { id: reporterId } });
    if (!reporter) {
      return NextResponse.json({ error: 'Reporter session not found' }, { status: 404 });
    }

    await prisma.report.create({
      data: {
        roomId: message.roomId,
        messageId,
        reporterId,
        reportedSessionId: message.sessionId,
        reason,
        description: typeof description === 'string' ? description.slice(0, 200) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
