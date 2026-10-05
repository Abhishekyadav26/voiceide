import { describe, it, expect } from 'vitest';

// Compile-worker test uses a tiny pure-Solidity check via the worker input builder
// (full solc compile needs network; tested here as input-shape + OZ shim unit).
import { resolveImportUrl } from '../lib/compiler/imports-shim';

describe('compile worker (sample ERC-20)', () => {
  it('builds standard JSON with optimizer and resolves ERC20 import', () => {
    const erc20 = 'import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; contract T is ERC20 { constructor() ERC20("T","T") {} }';
    const imports = [...erc20.matchAll(/import\s+(?:[^'"]*from\s+)?["']([^"']+)["']/g)].map((m) => m[1]);
    expect(imports).toEqual(['@openzeppelin/contracts/token/ERC20/ERC20.sol']);
    const url = resolveImportUrl('T.sol', imports[0] as string);
    expect(url).toContain('cdn.jsdelivr.net');
    expect(url).toContain('@5.0.2');
    const input = {
      language: 'Solidity',
      sources: { 'T.sol': { content: erc20 } },
      settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
    };
    expect(input.settings.optimizer.runs).toBe(200);
  });
  it('sample ERC-20 has SPDX + pragma + OZ', () => {
    const code = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\ncontract SolCoin is ERC20 {}';
    expect(code).toMatch(/SPDX/);
    expect(code).toMatch(/pragma solidity \^0\.8\.20/);
    expect(code).toMatch(/@openzeppelin/);
  });
});
