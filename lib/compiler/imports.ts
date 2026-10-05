import { get, set, del } from 'idb-keyval';
import { APP_CONFIG } from '../config';

const PREFIX = 'voicesol:oz:';

async function fetchWithTimeout(url: string, ms = 15000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CDN ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Resolve an import path (absolute @openzeppelin/... or relative) to file content. Pure + testable core in resolveImportUrl. */
export function resolveImportUrl(sourcePath: string, importPath: string): string | null {
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    const rest = importPath.replace('@openzeppelin/contracts/', '');
    return `${APP_CONFIG.ozCdnBase}${rest}`;
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const base = sourcePath.split('/').slice(0, -1);
    const parts = importPath.split('/');
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') base.pop();
      else base.push(p);
    }
    return `local:${base.join('/')}`;
  }
  return null;
}

export async function resolveImport(sourcePath: string, importPath: string): Promise<string> {
  const url = resolveImportUrl(sourcePath, importPath);
  if (!url) throw new Error(`Cannot resolve import "${importPath}" from "${sourcePath}". Only @openzeppelin/contracts and relative imports are supported.`);
  if (url.startsWith('local:')) {
    throw new Error(`Relative import "${importPath}" could not be resolved — keep contracts in a single file or use @openzeppelin imports.`);
  }
  const key = PREFIX + url;
  const cached = await get<string>(key).catch(() => undefined);
  if (cached) return cached;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(`Offline: cannot fetch "${importPath}". Reconnect to download OpenZeppelin sources (cached copies still work).`);
  }
  const content = await fetchWithTimeout(url);
  await set(key, content).catch(() => undefined);
  return content;
}

export async function clearImportCache(): Promise<void> {
  void del;
}
