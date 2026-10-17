import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { hashIP, maskIP } from '@/lib/ip';
import { blockIPInRedis, unblockIPInRedis } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const [blocked, total] = await Promise.all([
    prisma.blockedIP.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blockedIP.count(),
  ]);

  return NextResponse.json({
    blocked: blocked.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString() || null,
    })),
    total, page, pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { ip, reason, durationHours, isPermanent } = body;

  if (!ip || !reason) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const ipHashValue = hashIP(ip);
  const masked = maskIP(ip);
  const durationMs = (durationHours || 24) * 60 * 60 * 1000;
  const expiresAt = isPermanent ? null : new Date(Date.now() + durationMs);

  await prisma.blockedIP.upsert({
    where: { ipHash: ipHashValue },
    update: { reason, isPermanent: !!isPermanent, expiresAt, createdAt: new Date(), createdBy: admin.adminId },
    create: { ipHash: ipHashValue, ipMasked: masked, reason, isPermanent: !!isPermanent, expiresAt, createdBy: admin.adminId },
  });

  await blockIPInRedis(ipHashValue, isPermanent ? 365 * 24 * 60 * 60 * 1000 : durationMs);

  await prisma.adminLog.create({
    data: { adminId: admin.adminId, action: 'BLOCK_IP', details: `Blocked ${masked}: ${reason}` },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const blocked = await prisma.blockedIP.findUnique({ where: { id } });
  if (!blocked) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await unblockIPInRedis(blocked.ipHash);
  await prisma.blockedIP.delete({ where: { id } });

  await prisma.adminLog.create({
    data: { adminId: admin.adminId, action: 'UNBLOCK_IP', details: `Unblocked ${blocked.ipMasked}` },
  });

  return NextResponse.json({ success: true });
}
