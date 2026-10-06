import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { IntentSchema, ParseRequestSchema } from '@/lib/intents/schema';
import { INTENT_SYSTEM_PROMPT, buildUserMessage } from '@/lib/intents/prompts';
import { rateLimit, sanitizeLog } from '@/lib/ratelimit';
import { APP_CONFIG } from '@/lib/config';

export const runtime = 'nodejs';

const client = (): Groq => new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

function fallbackParse(text: string): unknown {
  const t = text.toLowerCase();
  if (/compile|build it/.test(t)) return { intent: 'compile' };
  if (/fix.*error|fix it/.test(t)) return { intent: 'fix_errors' };
  if (/explain|what does/.test(t)) return { intent: 'explain' };
  if (/audit|vulnerab|security/.test(t)) return { intent: 'audit' };
  if (/deploy/.test(t)) return { intent: 'deploy' };
  if (/verify|verif/.test(t)) return { intent: 'verify' };
  if (/undo|revert/.test(t)) return { intent: 'undo' };
  if (/next step/.test(t)) return { intent: 'navigate_step', direction: 'next' };
  if (/go back|previous step/.test(t)) return { intent: 'navigate_step', direction: 'back' };
  if (/call\s+(\w+)/.test(t)) {
    const m = t.match(/call\s+(\w+)/);
    return { intent: 'call_function', functionName: m?.[1], functionArgs: [] };
  }
  if (/erc-?20|erc-?721|erc-?1155|vault|multisig|crowdfund/.test(t)) {
    const template = /721/.test(t) ? 'erc721' : /1155/.test(t) ? 'erc1155' : /vault/.test(t) ? 'vault' : /multisig/.test(t) ? 'multisig' : /crowdfund/.test(t) ? 'crowdfunding' : 'erc20';
    return { intent: 'set_template', template };
  }
  if (/write|create/.test(t)) return { intent: 'write_contract', description: text.slice(0, 500) };
  return { intent: 'clarify', question: 'What should I do — write, compile, deploy, or call a function?' };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(ip)) return NextResponse.json({ error: 'Rate limited. Try again shortly.' }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = ParseRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', details: parsed.error.flatten() }, { status: 400 });

  const { text, activeFile, fileList, activeCode, compilerOutput, deployments } = parsed.data;
  if (!process.env.GROQ_API_KEY) {
    const fb = fallbackParse(text);
    const v = IntentSchema.safeParse(fb);
    if (!v.success) return NextResponse.json({ intent: 'clarify', question: 'Could you rephrase that?' });
    return NextResponse.json(v.data);
  }
  try {
    const capped = {
      text, activeFile, fileList,
      activeCode: activeCode.slice(0, APP_CONFIG.maxLlmInputChars),
      compilerOutput, deployments,
    };
    const completion = await client().chat.completions.create({
      model: APP_CONFIG.model,
      max_tokens: 4000,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage({ ...capped, heard: capped.text }) },
      ],
    });
    const raw = (completion.choices[0]?.message?.content ?? '{}').trim().replace(/^```json\s*|\s*```$/g, '');
    let json: unknown;
    try {
      json = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ intent: 'clarify', question: 'I did not understand that. Could you rephrase?' });
    }
    const validated = IntentSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json({ intent: 'clarify', question: 'I need one more detail — could you say that again?' });
    }
    return NextResponse.json(validated.data);
  } catch (e) {
    console.error('parse route:', sanitizeLog(String(e)));
    const fb = fallbackParse(text);
    const v = IntentSchema.safeParse(fb);
    if (v.success) return NextResponse.json({ ...v.data, message: 'AI unavailable — used local fallback.' });
    return NextResponse.json({ intent: 'clarify', question: 'The assistant is unavailable. Try "compile" or "write an ERC-20".' }, { status: 502 });
  }
}
