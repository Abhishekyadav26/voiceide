/// <reference lib="webworker" />
/* solc-js Web Worker. Loads pinned solc from CDN, compiles standard JSON, resolves OZ imports via jsDelivr. */
import { resolveImportUrl } from './imports-shim';

declare const self: DedicatedWorkerGlobalScope & { importScripts: (...urls: string[]) => void };
declare const Module: unknown;

const SOLC_CDN: Record<string, string> = {
  '0.8.24': 'https://cdn.jsdelivr.net/npm/solc@0.8.24/soljson-v0.8.24+commit.e11b9ed9.js',
};

interface SolcOutput { errors?: { severity: string; formattedMessage: string; sourceLocation?: { file: string; start: number; end: number }; type: string }[]; contracts?: Record<string, Record<string, { abi: unknown[]; evm: { bytecode: { object: string }; deployedBytecode: { object: string } } }>>; sources?: unknown }

let solcInstance: { compile: (input: string) => string } | null = null;
let loadedVersion = '';

function loadSolc(version: string): Promise<void> {
  if (solcInstance && loadedVersion === version) return Promise.resolve();
  const url = SOLC_CDN[version];
  if (!url) throw new Error(`Unsupported solc version ${version}. Pinned: ${Object.keys(SOLC_CDN).join(', ')}`);
  return new Promise((resolve, reject) => {
    try {
      self.importScripts(url);
      const check = (): void => {
        const m = (self as unknown as { Module?: { cwrap?: (fn: string, a: string, b: string[]) => (input: string) => string } }).Module;
        if (m?.cwrap) {
          const compile = m.cwrap('solidity_compile', 'string', ['string']);
          solcInstance = { compile };
          loadedVersion = version;
          resolve();
        } else setTimeout(check, 50);
      };
      check();
    } catch (e) { reject(e as Error); }
  });
}

async function fetchSource(url: string, cache: Map<string, string>): Promise<string> {
  const hit = cache.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Import fetch failed (${res.status}): ${url}`);
  const text = await res.text();
  cache.set(url, text);
  return text;
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { id: number; type: string; files: Record<string, string>; solcVersion: string; optimizerRuns: number };
  if (msg.type !== 'compile') return;
  const started = Date.now();
  const post = (m: unknown): void => self.postMessage(m);
  try {
    post({ id: msg.id, type: 'progress', message: `Loading solc ${msg.solcVersion}…` });
    await loadSolc(msg.solcVersion);
    const cache = new Map<string, string>();
    // Collect transitive OZ imports
    const sources: Record<string, { content: string }> = {};
    for (const [name, content] of Object.entries(msg.files)) sources[name] = { content };
    const queue = Object.entries(msg.files);
    const seen = new Set(Object.keys(msg.files));
    const importRe = /import\s+(?:[^'"]*from\s+)?["']([^"']+)["']/g;
    while (queue.length) {
      const [path, content] = queue.pop() as [string, string];
      const matches = [...content.matchAll(importRe)].map((m) => m[1] as string);
      for (const imp of matches) {
        const url = resolveImportUrl(path, imp);
        if (!url || url.startsWith('local:')) continue;
        const fileName = '@openzeppelin/contracts/' + url.split('/contracts/')[1];
        if (seen.has(fileName)) continue;
        seen.add(fileName);
        post({ id: msg.id, type: 'progress', message: `Fetching ${imp}…` });
        try {
          const text = await fetchSource(url, cache);
          sources[fileName] = { content: text };
          queue.push([fileName, text]);
        } catch (err) {
          throw new Error(`Cannot resolve import "${imp}" from "${path}": ${(err as Error).message}. Check you are online; OZ sources are cached after first fetch.`);
        }
      }
    }
    post({ id: msg.id, type: 'progress', message: 'Compiling…' });
    const input = {
      language: 'Solidity',
      sources,
      settings: {
        optimizer: { enabled: true, runs: msg.optimizerRuns },
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] } },
      },
    };
    const raw = solcInstance?.compile(JSON.stringify(input)) ?? '{}';
    const output = JSON.parse(raw) as SolcOutput;
    const errors: unknown[] = [];
    const warnings: unknown[] = [];
    for (const err of output.errors ?? []) {
      const loc = err.sourceLocation;
      let line = 1; let column = 1;
      if (loc) {
        const src = sources[loc.file]?.content ?? '';
        const upto = src.slice(0, loc.start);
        line = upto.split('\n').length;
        column = loc.start - (upto.lastIndexOf('\n') + 1) + 1;
      }
      const item = { severity: err.severity, file: loc?.file ?? '', line, column, message: err.formattedMessage, type: err.type };
      if (err.severity === 'error') errors.push(item);
      else warnings.push(item);
    }
    const contracts: unknown[] = [];
    for (const [file, cs] of Object.entries(output.contracts ?? {})) {
      for (const [name, c] of Object.entries(cs)) {
        const bytecode = `0x${c.evm.bytecode.object}`;
        const deployed = `0x${c.evm.deployedBytecode.object}`;
        contracts.push({
          name: `${file}:${name}`,
          abi: c.abi, bytecode,
          bytecodeSize: Math.max(0, (bytecode.length - 2) / 2),
          deployedBytecodeSize: Math.max(0, (deployed.length - 2) / 2),
        });
      }
    }
    post({
      id: msg.id, type: 'compiled',
      result: { success: errors.length === 0, contracts, errors, warnings, compileTimeMs: Date.now() - started },
    });
  } catch (err) {
    post({ id: msg.id, type: 'error', error: (err as Error).message });
  }
};
export {};
