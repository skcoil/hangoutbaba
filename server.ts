import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const pub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function hashIP(ip: string): string {
  const secret = process.env.SESSION_SECRET || 'default-secret';
  return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

function sanitize(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.adminSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;
  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.pexpire(redisKey, windowMs);
    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;
    return count <= limit;
  } catch {
    return true;
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Subscribe to Redis for pub/sub
  sub.subscribe('room:message', 'room:update', (err) => {
    if (err) console.error('[Redis Sub] Error:', err);
  });

  sub.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      if (channel === 'room:message') {
        io.to(`room:${data.roomSlug}`).emit('message:new', data.message);
      } else if (channel === 'room:update') {
        io.to(`room:${data.roomSlug}`).emit('room:count-update', data.count);
      }
    } catch {}
  });

  // Auth middleware
  io.use(async (socket, next) => {
    const sessionId = socket.handshake.auth?.sessionId as string;
    const username = socket.handshake.auth?.username as string;

    if (!sessionId || !username) {
      return next(new Error('Missing session credentials'));
    }

    const ip = socket.handshake.headers['x-forwarded-for']
      ? (socket.handshake.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : socket.handshake.address;

    const ipHash = hashIP(ip);

    // Check if IP is blocked
    const blocked = await redis.get(`blocked:ip:${ipHash}`);
    if (blocked) {
      return next(new Error('Your connection has been blocked'));
    }

    // Validate session
    const session = await prisma.anonymousSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.isBanned) {
      return next(new Error('Invalid or banned session'));
    }

    socket.data = { sessionId, username: session.username, ipHash };
    next();
  });

  io.on('connection', (socket) => {
    const { sessionId, username } = socket.data as {
      sessionId: string;
      username: string;
      ipHash: string;
    };

    console.log(`[WS] Connected: ${username} (${sessionId})`);

    // Update last seen
    prisma.anonymousSession.update({
      where: { id: sessionId },
      data: { lastSeen: new Date() },
    }).catch(() => {});

    socket.on('room:join', async (slug: string) => {
      if (typeof slug !== 'string' || slug.length > 60) return;

      const room = await prisma.room.findUnique({ where: { slug } });
      if (!room) return;

      // Leave current rooms
      const rooms = [...socket.rooms].filter((r) => r.startsWith('room:'));
      for (const r of rooms) {
        socket.leave(r);
        const roomSlug = r.replace('room:', '');
        // Decrement count
        const countKey = `room:count:${roomSlug}`;
        const newCount = await redis.decr(countKey);
        const finalCount = Math.max(0, newCount);
        if (finalCount === 0) await redis.del(countKey);
        io.to(r).emit('room:user-left', { username, count: finalCount });
        io.to(r).emit('room:count-update', finalCount);
        // Remove from room members set
        await redis.srem(`room:members:${roomSlug}`, sessionId);
      }

      // Join new room
      socket.join(`room:${slug}`);
      const countKey = `room:count:${slug}`;
      const count = await redis.incr(countKey);
      await redis.expire(countKey, 3600);
      await redis.sadd(`room:members:${slug}`, sessionId);
      await redis.expire(`room:members:${slug}`, 3600);

      // Update DB
      await prisma.anonymousSession.update({
        where: { id: sessionId },
        data: { currentRoomId: room.id },
      }).catch(() => {});

      await prisma.room.update({
        where: { slug },
        data: { activeUserCount: count, lastActivity: new Date() },
      }).catch(() => {});

      io.to(`room:${slug}`).emit('room:user-joined', { username, count });
      socket.emit('room:count-update', count);
    });

    socket.on('room:leave', async (slug: string) => {
      if (typeof slug !== 'string') return;
      socket.leave(`room:${slug}`);
      const countKey = `room:count:${slug}`;
      const newCount = await redis.decr(countKey);
      const finalCount = Math.max(0, newCount);
      if (finalCount === 0) await redis.del(countKey);
      await redis.srem(`room:members:${slug}`, sessionId);
      io.to(`room:${slug}`).emit('room:user-left', { username, count: finalCount });
      io.to(`room:${slug}`).emit('room:count-update', finalCount);
    });

    socket.on('message:send', async (data: { roomSlug: string; content: string }) => {
      if (!data?.roomSlug || !data?.content) return;
      if (typeof data.content !== 'string') return;

      const settings = await getSettings();
      const maxLen = parseInt(settings.maxMessageLength || '500', 10);
      const rateLimit = parseInt(settings.rateLimitMessages || '10', 10);
      const windowMs = parseInt(settings.rateLimitWindowMs || '10000', 10);

      const content = sanitize(data.content).slice(0, maxLen);
      if (!content) return;

      // Rate limit check
      const allowed = await checkRateLimit(`msg:${sessionId}`, rateLimit, windowMs);
      if (!allowed) {
        socket.emit('error', 'You are sending messages too fast. Please slow down.');
        return;
      }

      const room = await prisma.room.findUnique({ where: { slug: data.roomSlug } });
      if (!room) return;

      // Check session in room
      const inRoom = socket.rooms.has(`room:${data.roomSlug}`);
      if (!inRoom) return;

      // Save message
      const message = await prisma.message.create({
        data: {
          roomId: room.id,
          sessionId,
          content,
        },
      });

      // Update counts
      await prisma.anonymousSession.update({
        where: { id: sessionId },
        data: { messageCount: { increment: 1 } },
      }).catch(() => {});

      await prisma.room.update({
        where: { id: room.id },
        data: { messageCount: { increment: 1 }, lastActivity: new Date() },
      }).catch(() => {});

      const messageData = {
        id: message.id,
        roomId: room.id,
        sessionId,
        username,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };

      // Broadcast to room
      await pub.publish('room:message', JSON.stringify({ roomSlug: data.roomSlug, message: messageData }));
    });

    socket.on('message:delete', async (messageId: string) => {
      if (typeof messageId !== 'string') return;
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.sessionId !== sessionId) return;
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      io.to(`room:${message.roomId}`).emit('message:deleted', messageId);
    });

    socket.on('typing:start', (roomSlug: string) => {
      if (typeof roomSlug !== 'string') return;
      socket.to(`room:${roomSlug}`).emit('typing:start', username);
    });

    socket.on('typing:stop', (roomSlug: string) => {
      if (typeof roomSlug !== 'string') return;
      socket.to(`room:${roomSlug}`).emit('typing:stop', username);
    });

    socket.on('disconnect', async () => {
      console.log(`[WS] Disconnected: ${username}`);
      // Clean up all rooms
      for (const r of [...socket.rooms]) {
        if (r.startsWith('room:')) {
          const roomSlug = r.replace('room:', '');
          const countKey = `room:count:${roomSlug}`;
          const newCount = await redis.decr(countKey);
          const finalCount = Math.max(0, newCount);
          if (finalCount === 0) await redis.del(countKey);
          await redis.srem(`room:members:${roomSlug}`, sessionId);
          io.to(r).emit('room:user-left', { username, count: finalCount });
          io.to(r).emit('room:count-update', finalCount);
        }
      }

      await prisma.anonymousSession.update({
        where: { id: sessionId },
        data: { lastSeen: new Date(), currentRoomId: null },
      }).catch(() => {});
    });
  });

  httpServer.listen(port, () => {
    console.log(`✅ HangoutBaba running at http://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? 'development' : 'production'}`);
  });
});
