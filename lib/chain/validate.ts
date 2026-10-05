import type { Abi } from 'viem';
import { isAddress, getAddress } from 'viem';

export interface ConstructorField { name: string; type: string; internalType?: string }

export function validateArg(type: string, raw: string): { ok: boolean; error?: string } {
  const v = raw.trim();
  if (type === 'address') {
    if (!isAddress(v)) return { ok: false, error: 'Invalid address (0x + 40 hex chars)' };
    return { ok: true };
  }
  if (/^uint(\d+)?$/.test(type)) {
    if (!/^\d+$/.test(v)) return { ok: false, error: `${type} must be a non-negative integer` };
    return { ok: true };
  }
  if (/^int(\d+)?$/.test(type)) {
    if (!/^-?\d+$/.test(v)) return { ok: false, error: `${type} must be an integer` };
    return { ok: true };
  }
  if (type === 'bool') {
    if (v !== 'true' && v !== 'false') return { ok: false, error: 'bool must be true or false' };
    return { ok: true };
  }
  if (type === 'string') return { ok: v.length > 0, error: v.length > 0 ? undefined : 'string cannot be empty' };
  if (type.startsWith('bytes')) {
    if (!/^0x[0-9a-fA-F]*$/.test(v)) return { ok: false, error: 'bytes must be 0x hex' };
    return { ok: true };
  }
  if (type.endsWith('[]')) {
    try {
      const parsed = JSON.parse(v);
      if (!Array.isArray(parsed)) return { ok: false, error: 'Array must be JSON like ["a","b"]' };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Array must be valid JSON array' };
    }
  }
  return { ok: v.length > 0, error: v.length > 0 ? undefined : 'Value required' };
}

/** Coerce a string form value to a viem-compatible arg. */
export function coerceArg(type: string, raw: string): unknown {
  const v = raw.trim();
  if (type === 'address') return getAddress(v);
  if (type === 'bool') return v === 'true';
  if (/^uint|^int/.test(type)) {
    return type === 'uint256' || type === 'int256' ? BigInt(v) : Number(v);
  }
  if (type.endsWith('[]')) return JSON.parse(v) as unknown[];
  return v;
}

export function getConstructorInputs(abi: Abi): ConstructorField[] {
  const ctor = (abi as unknown[]).find((e) => (e as { type?: string }).type === 'constructor') as unknown as { inputs?: ConstructorField[] } | undefined;
  return ctor?.inputs ?? [];
}

export interface DeployGate {
  compiled: boolean;
  onCorrectChain: boolean;
  hasBalance: boolean;
  argsValid: boolean;
  enabled: boolean;
  reasons: string[];
}

export function deployEnabled(input: {
  compiledOk: boolean;
  chainId: number | undefined;
  balanceWei: bigint | undefined;
  estimatedGasWei: bigint | undefined;
  argsValid: boolean;
  expectedChainId: number;
}): DeployGate {
  const reasons: string[] = [];
  if (!input.compiledOk) reasons.push('Compile successfully first (no errors).');
  const onCorrectChain = input.chainId === input.expectedChainId;
  if (!onCorrectChain) reasons.push(`Switch wallet to chain ${input.expectedChainId}.`);
  const hasBalance = input.balanceWei !== undefined && input.balanceWei > 0n;
  if (!hasBalance) reasons.push('Wallet balance is zero — get testnet ETH from the faucet.');
  if (input.balanceWei !== undefined && input.estimatedGasWei !== undefined && input.balanceWei < input.estimatedGasWei) {
    reasons.push('Balance below estimated gas cost.');
  }
  if (!input.argsValid) reasons.push('Fill in all constructor fields correctly.');
  return {
    compiled: input.compiledOk,
    onCorrectChain,
    hasBalance,
    argsValid: input.argsValid,
    enabled: reasons.length === 0,
    reasons,
  };
}
