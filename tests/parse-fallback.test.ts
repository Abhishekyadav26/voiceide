import { describe, it, expect } from 'vitest';
import { fallbackParse, extractContractName, repairVoice } from '../lib/intents/fallback';
import { IntentSchema } from '../lib/intents/schema';

describe('fallbackParse', () => {
  it('maps "write a hello contract in sol" to write_contract with a usable name', () => {
    const r = IntentSchema.safeParse(fallbackParse('write a hello contract in sol'));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.intent).toBe('write_contract');
      expect(r.data.contractName).toBe('Hello');
    }
  });
  it('extracts "called" names', () => {
    expect(extractContractName('write an erc-20 called sol coin')).toBe('SolCoin');
  });
  it('keeps template routing for standards', () => {
    const r = IntentSchema.safeParse(fallbackParse('write an ERC-20 called Sol Coin'));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ intent: 'set_template', template: 'erc20' });
  });
  it('still handles compile/fix/undo', () => {
    expect(IntentSchema.safeParse(fallbackParse('compile')).success).toBe(true);
    expect(IntentSchema.safeParse(fallbackParse('fix the errors')).success).toBe(true);
    expect(IntentSchema.safeParse(fallbackParse('undo that')).success).toBe(true);
  });
  it('repairs STT mis-hearings of deploy', () => {
    for (const heard of ['deploy', 'the ploy', 'um, deploy please', 'deploying the contract']) {
      const r = IntentSchema.safeParse(fallbackParse(heard));
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.intent).toBe('deploy');
    }
    expect(repairVoice('the ploy')).toContain('deploy');
  });
  it('repairs "right a … contract" to write', () => {
    const r = IntentSchema.safeParse(fallbackParse('right a hello contract'));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.intent).toBe('write_contract');
  });
});
