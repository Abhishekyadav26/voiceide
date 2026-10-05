import { describe, it, expect } from 'vitest';
import { validateArg, coerceArg, deployEnabled, getConstructorInputs } from '../lib/chain/validate';

describe('constructor validation', () => {
  it('accepts valid address', () => expect(validateArg('address', '0x0000000000000000000000000000000000000001').ok).toBe(true));
  it('rejects bad address', () => expect(validateArg('address', 'not-an-address').ok).toBe(false));
  it('rejects negative uint', () => expect(validateArg('uint256', '-5').ok).toBe(false));
  it('accepts bool strings only', () => {
    expect(validateArg('bool', 'true').ok).toBe(true);
    expect(validateArg('bool', 'yes').ok).toBe(false);
  });
  it('arrays need JSON', () => {
    expect(validateArg('address[]', '["0x0000000000000000000000000000000000000001"').ok).toBe(false);
    expect(validateArg('address[]', 'not-an-array').ok).toBe(false);
    expect(validateArg('uint256[]', '[1,2]').ok).toBe(true);
  });
  it('coerces uint256 to bigint', () => expect(coerceArg('uint256', '100')).toBe(100n));
  it('extracts constructor inputs from ABI', () => {
    const abi = [{ type: 'constructor', inputs: [{ name: 'goal', type: 'uint256' }] }] as never[];
    expect(getConstructorInputs(abi)).toHaveLength(1);
  });
});

describe('deploy gate', () => {
  const base = { compiledOk: true, chainId: 84532, balanceWei: 10n ** 16n, estimatedGasWei: 1000n, argsValid: true, expectedChainId: 84532 };
  it('enabled when all good', () => expect(deployEnabled(base).enabled).toBe(true));
  it('refuses wrong chain', () => {
    const g = deployEnabled({ ...base, chainId: 1 });
    expect(g.enabled).toBe(false);
    expect(g.reasons.join('')).toMatch(/84532/);
  });
  it('refuses zero balance', () => {
    expect(deployEnabled({ ...base, balanceWei: 0n }).enabled).toBe(false);
  });
  it('refuses uncompiled', () => {
    expect(deployEnabled({ ...base, compiledOk: false }).enabled).toBe(false);
  });
});
