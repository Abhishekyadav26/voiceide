/** Minimal shim of resolveImportUrl for the Web Worker (no IndexedDB, no window). Duplicated to keep worker dependency-free. */
const OZ_BASE = 'https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/';
export function resolveImportUrl(sourcePath: string, importPath: string): string | null {
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    return `${OZ_BASE}${importPath.replace('@openzeppelin/contracts/', '')}`;
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
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
