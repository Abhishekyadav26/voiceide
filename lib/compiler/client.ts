import type { CompileResult, WorkerRequest, WorkerResponse } from './types';
import { APP_CONFIG } from '../config';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: CompileResult) => void; reject: (e: Error) => void; onProgress?: (m: string) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker-wrapper.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const p = pending.get(msg.id);
      if (!p) return;
      if (msg.type === 'progress') p.onProgress?.(msg.message ?? '');
      else if (msg.type === 'compiled' && msg.result) { pending.delete(msg.id); p.resolve(msg.result); }
      else if (msg.type === 'error') { pending.delete(msg.id); p.reject(new Error(msg.error ?? 'Compile failed')); }
    };
  }
  return worker;
}

export function compileContracts(
  files: Record<string, string>,
  onProgress?: (m: string) => void,
): Promise<CompileResult> {
  const id = nextId++;
  const req: WorkerRequest = { id, type: 'compile', files, solcVersion: APP_CONFIG.solcVersion, optimizerRuns: APP_CONFIG.optimizerRuns };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    try {
      getWorker().postMessage(req);
    } catch (e) {
      pending.delete(id);
      reject(e as Error);
    }
  });
}

export function terminateCompiler(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
