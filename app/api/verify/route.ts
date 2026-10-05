import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, sanitizeLog } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const Body = z.object({
  action: z.enum(['submit', 'status']),
  chainId: z.literal(84532),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  guid: z.string().max(100).optional(),
  standardJson: z.string().max(500000).optional(),
  contractName: z.string().max(200).optional(),
  compilerVersion: z.string().max(30).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(`verify:${ip}`)) return NextResponse.json({ error: 'Rate limited.' }, { status: 429 });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) return NextResponse.json({ error: 'ETHERSCAN_API_KEY not configured.' }, { status: 503 });
  const base = 'https://api.etherscan.io/v2/api';
  try {
    if (parsed.data.action === 'submit') {
      const form = new URLSearchParams({
        chainid: '84532',
        module: 'contract',
        action: 'verifysourcecode',
        codeformat: 'solidity-standard-json-input',
        sourceCode: parsed.data.standardJson ?? '',
        contractaddress: parsed.data.address ?? '',
        contractname: parsed.data.contractName ?? '',
        compilerversion: parsed.data.compilerVersion ?? 'v0.8.24+commit.e11b9ed9',
      });
      const res = await fetch(`${base}?apikey=${key}`, { method: 'POST', body: form });
      const json = (await res.json()) as { status: string; result: string; message: string };
      return NextResponse.json(json);
    }
    const res = await fetch(`${base}?chainid=84532&module=contract&action=checkverifystatus&guid=${parsed.data.guid}&apikey=${key}`);
    const json = (await res.json()) as unknown;
    return NextResponse.json(json);
  } catch (e) {
    console.error('verify route:', sanitizeLog(String(e)));
    return NextResponse.json({ error: 'Verification service unavailable.' }, { status: 502 });
  }
}
