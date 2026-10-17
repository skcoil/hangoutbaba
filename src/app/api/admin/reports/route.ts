import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || undefined;
  const limit = 20;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: status ? { status: status as 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED' } : {},
      include: {
        message: { select: { content: true } },
        reporter: { select: { username: true } },
        reportedSession: { select: { username: true } },
        room: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where: status ? { status: status as 'PENDING' } : {} }),
  ]);

  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() || null,
    })),
    total, page, pages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { reportId, status } = body;

  if (!reportId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await prisma.report.update({
    where: { id: reportId },
    data: { status, resolvedAt: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : undefined, resolvedBy: admin.adminId },
  });

  return NextResponse.json({ success: true });
}
