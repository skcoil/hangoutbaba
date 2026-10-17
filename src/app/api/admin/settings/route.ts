import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.adminSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json(map);
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const allowed = [
    'maxMessageLength', 'rateLimitMessages', 'rateLimitWindowMs',
    'maxRoomSize', 'messageRetentionDays', 'sessionTimeoutMinutes',
    'ipBlockDurationHours', 'roomInactivityHours', 'maintenanceMode',
  ];

  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key)) continue;
    await prisma.adminSetting.upsert({
      where: { key },
      update: { value: String(value), updatedAt: new Date() },
      create: { key, value: String(value) },
    });
  }

  await prisma.adminLog.create({
    data: { adminId: admin.adminId, action: 'UPDATE_SETTINGS', details: JSON.stringify(body) },
  });

  return NextResponse.json({ success: true });
}
