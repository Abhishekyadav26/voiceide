import { describe, it, expect } from 'vitest';
import { resolveImportUrl } from '../lib/compiler/imports';

describe('import resolver', () => {
  it('resolves OZ imports to pinned jsDelivr CDN', () => {
    expect(resolveImportUrl('SolCoin.sol', '@openzeppelin/contracts/token/ERC20/ERC20.sol'))
      .toBe('https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/token/ERC20/ERC20.sol');
  });
  it('resolves relative imports to local: scheme', () => {
    expect(resolveImportUrl('contracts/A.sol', './B.sol')).toBe('local:contracts/B.sol');
  });
  it('returns null for unknown schemes', () => {
    expect(resolveImportUrl('A.sol', 'hardhat/console.sol')).toBe(null);
  });
});
