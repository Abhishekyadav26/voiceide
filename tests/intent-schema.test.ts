import { describe, it, expect } from 'vitest';
import { IntentSchema } from '../lib/intents/schema';

describe('intent schema', () => {
  it('accepts a valid write_contract intent', () => {
    const r = IntentSchema.safeParse({ intent: 'write_contract', contractName: 'SolCoin', template: 'erc20' });
    expect(r.success).toBe(true);
  });
  it('accepts clarify with a question', () => {
    const r = IntentSchema.safeParse({ intent: 'clarify', question: 'Which token standard?' });
    expect(r.success).toBe(true);
  });
  it('rejects unknown intent', () => {
    const r = IntentSchema.safeParse({ intent: 'teleport' });
    expect(r.success).toBe(false);
  });
  it('rejects code that is too long', () => {
    const r = IntentSchema.safeParse({ intent: 'write_contract', code: 'x'.repeat(70000) });
    expect(r.success).toBe(false);
  });
  it('rejects oversized functionArgs', () => {
    const r = IntentSchema.safeParse({ intent: 'call_function', functionName: 'transfer', functionArgs: Array(25).fill('a') });
    expect(r.success).toBe(false);
  });
});
