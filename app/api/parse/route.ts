import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { IntentSchema, ParseRequestSchema } from '@/lib/intents/schema';
import { INTENT_SYSTEM_PROMPT, buildUserMessage } from '@/lib/intents/prompts';
import { fallbackParse, repairVoice } from '@/lib/intents/fallback';
import { rateLimit, sanitizeLog } from '@/lib/ratelimit';
import { APP_CONFIG } from '@/lib/config';

export const runtime = 'nodejs';

const client = (): Groq => new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

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

  const { text: rawText, activeFile, fileList, activeCode, compilerOutput, deployments } = parsed.data;
  // Clean filler words and repair common STT mis-hearings ("the ploy" -> deploy)
  // so both the local fallback and the AI parser see the intended command.
  const text = repairVoice(rawText);
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
