/** Minimal shim of import resolution for the Web Worker (no IndexedDB, no window). Duplicated to keep worker dependency-free. */
export const OZ_BASE = 'https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/';
const OZ_PREFIX = '@openzeppelin/contracts/';
export function resolveImportUrl(sourcePath: string, importPath: string): string | null {
  if (importPath.startsWith(OZ_PREFIX)) {
    return `${OZ_BASE}${importPath.slice(OZ_PREFIX.length)}`;
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Relative imports inside the OpenZeppelin tree resolve against the CDN.
    if (sourcePath.startsWith(OZ_PREFIX)) {
      const base = sourcePath.slice(OZ_PREFIX.length).split('/').slice(0, -1);
      for (const p of importPath.split('/')) {
        if (p === '.' || p === '') continue;
        else if (p === '..') base.pop();
        else base.push(p);
      }
      return `${OZ_BASE}${base.join('/')}`;
    }
    const base = sourcePath.split('/').slice(0, -1);
    for (const p of importPath.split('/')) {
      if (p === '.') continue;
      else if (p === '..') base.pop();
      else base.push(p);
    }
    return `local:${base.join('/')}`;
  }
  return null;
}

/** Map a fetched CDN URL back to its canonical source-unit name for standard JSON. */
export function fileNameForUrl(url: string, fallback: string): string {
  if (url.startsWith(OZ_BASE)) return `${OZ_PREFIX}${url.slice(OZ_BASE.length)}`;
  return fallback;
}
