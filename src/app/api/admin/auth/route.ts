import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signAdminToken, verifyPassword, hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashIP, getClientIP } from '@/lib/ip';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed } = await checkRateLimit(`admin:login:${hashIP(ip)}`, 5, 300000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      await prisma.adminLog.create({
        data: { action: 'ADMIN_LOGIN_FAILED', details: `Failed login for: ${username}`, ipHash: hashIP(ip) },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signAdminToken({ adminId: admin.id, username: admin.username });

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    await prisma.adminLog.create({
      data: { adminId: admin.id, action: 'ADMIN_LOGIN', details: `Login by: ${username}`, ipHash: hashIP(ip) },
    });

    return NextResponse.json({ token, username: admin.username });
  } catch (error) {
    console.error('[Admin] Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/auth/setup — create initial admin (requires setup token)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password, setupToken } = body;

    if (setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
    }

    if (!username || !password || password.length < 8) {
      return NextResponse.json({ error: 'Username and password (min 8 chars) required' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const admin = await prisma.admin.upsert({
      where: { username },
      update: { passwordHash },
      create: { username, passwordHash },
    });

    return NextResponse.json({ id: admin.id, username: admin.username });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
