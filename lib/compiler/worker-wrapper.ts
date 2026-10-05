/// <reference lib="webworker" />
/* Worker wrapper: uses solc npm package compiled output via dynamic ESM CDN import.
   Keeps UI thread free; falls back to clear error offline. */
import { resolveImportUrl, fileNameForUrl } from './imports-shim';

declare const self: DedicatedWorkerGlobalScope;

interface SolcJson { compile: (input: string) => string }

interface SolcJson { compile: (input: string) => string }

interface EmscriptenModule {
  cwrap: (fn: string, returnType: string, argTypes: string[]) => (input: string) => string;
  calledRun?: boolean;
  onRuntimeInitialized?: () => void;
}

/* soljson.js is a classic (non-ESM) emscripten script: it must be loaded with
   importScripts, which populates self.Module. Awaiting a dynamic ESM import of
   it yields a namespace without a callable factory ("factory is not a function"). */
async function loadSolc(version: string): Promise<SolcJson> {
  if (cached && cached.version === version) return cached.solc;
  // Built dynamically so the bundler leaves it as a runtime URL.
  const base = 'https://cdn.jsdelivr.net/npm/solc@';
  const url = `${base}${version}/soljson.js`;
  const g = self as unknown as { importScripts: (...urls: string[]) => void; Module?: EmscriptenModule };
  g.importScripts(url);
  const Module = g.Module;
  if (!Module) throw new Error(`solc ${version} failed to initialize (no Module after loading ${url}). Check network access to jsDelivr.`);
  await new Promise<void>((resolve) => {
    if (Module.calledRun) resolve();
    else Module.onRuntimeInitialized = (): void => resolve();
  });
  const compile = Module.cwrap('solidity_compile', 'string', ['string']) as (input: string) => string;
  const solc = { compile };
  cached = { version, solc };
  return solc;
}

let cached: { version: string; solc: SolcJson } | null = null;

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { id: number; type: string; files: Record<string, string>; solcVersion: string; optimizerRuns: number };
  if (msg.type !== 'compile') return;
  const started = Date.now();
  const post = (m: unknown): void => self.postMessage(m);
  try {
    post({ id: msg.id, type: 'progress', message: `Loading solc ${msg.solcVersion}…` });
    if (!cached || cached.version !== msg.solcVersion) {
      cached = { version: msg.solcVersion, solc: await loadSolc(msg.solcVersion) };
    }
    const sources: Record<string, { content: string }> = {};
    for (const [name, content] of Object.entries(msg.files)) sources[name] = { content };
    const queue = Object.entries(msg.files);
    const seen = new Set(Object.keys(msg.files));
    const importRe = /import\s+(?:[^'"]*from\s+)?["']([^"']+)["']/g;
    while (queue.length) {
      const [path, content] = queue.pop() as [string, string];
      for (const m of content.matchAll(importRe)) {
        const imp = m[1] as string;
        const url = resolveImportUrl(path, imp);
        if (!url || url.startsWith('local:')) continue;
        const fileName = fileNameForUrl(url, imp);
        if (seen.has(fileName)) continue;
        seen.add(fileName);
        post({ id: msg.id, type: 'progress', message: `Fetching ${imp}…` });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Cannot resolve import "${imp}" from "${path}": CDN ${res.status}. Check you are online.`);
        const text = await res.text();
        sources[fileName] = { content: text };
        queue.push([fileName, text]);
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
    const output = JSON.parse(cached.solc.compile(JSON.stringify(input))) as {
      errors?: { severity: string; formattedMessage: string; sourceLocation?: { file: string; start: number }; type: string }[];
      contracts?: Record<string, Record<string, { abi: unknown[]; evm: { bytecode: { object: string }; deployedBytecode: { object: string } } }>>;
    };
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
        contracts.push({
          name: `${file}:${name}`, abi: c.abi, bytecode,
          bytecodeSize: Math.max(0, (bytecode.length - 2) / 2),
          deployedBytecodeSize: Math.max(0, (`0x${c.evm.deployedBytecode.object}`.length - 2) / 2),
        });
      }
    }
    post({ id: msg.id, type: 'compiled', result: { success: errors.length === 0, contracts, errors, warnings, compileTimeMs: Date.now() - started } });
  } catch (err) {
    post({ id: msg.id, type: 'error', error: (err as Error).message });
  }
};
export {};
