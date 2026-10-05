import { describe, it, expect } from 'vitest';
import { parseSpokenNumber, tokenSupplyWithDecimals, normalizeSpokenName, cleanDictation } from '../lib/intents/normalize';

describe('spoken numbers', () => {
  it('"one million" -> 1000000', () => expect(parseSpokenNumber('one million')).toBe(1000000));
  it('"two million five hundred thousand" -> 2500000', () => expect(parseSpokenNumber('two million five hundred thousand')).toBe(2500000));
  it('self-correction resolves to final value', () => expect(parseSpokenNumber('one million, no make that two million')).toBe(2000000));
  it('digit + magnitude works', () => expect(parseSpokenNumber('2 million')).toBe(2000000));
  it('returns null for non-numbers', () => expect(parseSpokenNumber('hello world')).toBe(null));
  it('token decimals applied', () => {
    const s = tokenSupplyWithDecimals(1000000, 18);
    expect(s.expr).toBe('1000000 * 10**18');
    expect(s.comment).toContain('18 decimals');
  });
});

describe('spoken names', () => {
  it('"sol coin" -> SolCoin / "Sol Coin"', () => {
    expect(normalizeSpokenName('sol coin')).toEqual({ contractName: 'SolCoin', tokenName: 'Sol Coin' });
  });
});

describe('dictation cleaning', () => {
  it('removes fillers and keeps correction', () => {
    expect(cleanDictation('um write one million, no make that two million please')).toContain('two million');
  });
});
