import { describe, it, expect } from 'vitest';
import { resolveImportUrl, fileNameForUrl } from '../lib/compiler/imports-shim';

describe('worker import shim', () => {
  it('resolves absolute OZ imports to the pinned CDN', () => {
    expect(resolveImportUrl('SolCoin.sol', '@openzeppelin/contracts/token/ERC20/ERC20.sol'))
      .toBe('https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/token/ERC20/ERC20.sol');
  });
  it('resolves relative imports inside the OZ tree against the CDN', () => {
    expect(resolveImportUrl(
      '@openzeppelin/contracts/token/ERC20/ERC20.sol',
      './IERC20.sol',
    )).toBe('https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol');
    expect(resolveImportUrl(
      '@openzeppelin/contracts/token/ERC20/ERC20.sol',
      '../../utils/Context.sol',
    )).toBe('https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/utils/Context.sol');
  });
  it('maps CDN urls back to canonical source names (no doubled prefix)', () => {
    const url = 'https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol';
    expect(fileNameForUrl(url, 'fallback')).toBe('@openzeppelin/contracts/token/ERC20/IERC20.sol');
  });
});
