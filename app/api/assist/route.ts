import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { rateLimit, sanitizeLog } from '@/lib/ratelimit';
import { APP_CONFIG } from '@/lib/config';

export const runtime = 'nodejs';

const Body = z.object({
  mode: z.enum(['explain', 'audit', 'fix']),
  code: z.string().min(1).max(60000),
  errors: z.string().max(8000).optional().default(''),
});

const PROMPTS: Record<string, string> = {
  explain: 'Explain this Solidity contract in plain language: purpose, each function, and access control. Keep it under 300 words.',
  audit: 'Review this Solidity contract for common issues. Return a list of {severity: critical|high|medium|low|info, line, message}. Label output clearly as an AI review, NOT a security audit. JSON array only.',
  fix: 'Fix the Solidity compiler errors below. Return the COMPLETE corrected file only, no markdown fences. Keep SPDX, pragma ^0.8.20, NatSpec, OpenZeppelin v5 imports, custom errors.',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(`assist:${ip}`)) return NextResponse.json({ error: 'Rate limited.' }, { status: 429 });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY not configured.' }, { status: 503 });
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model: APP_CONFIG.model,
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        { role: 'system', content: PROMPTS[parsed.data.mode] ?? (PROMPTS.explain as string) },
        { role: 'user', content: `Code:\n${parsed.data.code.slice(0, 20000)}\n\nErrors:\n${parsed.data.errors.slice(0, 4000)}` },
      ],
    });
    return NextResponse.json({ text: completion.choices[0]?.message?.content ?? '' });
  } catch (e) {
    console.error('assist route:', sanitizeLog(String(e)));
    return NextResponse.json({ error: 'Assistant unavailable.' }, { status: 502 });
  }
}
