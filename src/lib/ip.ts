import crypto from 'crypto';

export function hashIP(ip: string): string {
  const secret = process.env.SESSION_SECRET || 'default-secret';
  return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

export function maskIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6 — show first two groups
    const parts = ip.split(':');
    return parts.slice(0, 2).join(':') + ':xxxx:xxxx';
  }
  // IPv4 — show first two octets
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
