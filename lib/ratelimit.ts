import { z } from 'zod';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 30;

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQ;
}

export function sanitizeLog(s: string): string {
  return s.replace(/0x[0-9a-fA-F]{40}/g, '0x…').replace(/sk-ant-[\w-]+/g, '[redacted]').slice(0, 2000);
}
