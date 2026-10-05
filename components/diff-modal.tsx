'use client';
import { useState } from 'react';
import { useIde } from '@/lib/store/ide';
import { APP_CONFIG } from '@/lib/config';

function diffLines(before: string, after: string): { type: 'same' | 'add' | 'del'; text: string }[] {
  const a = before.split('\n'); const b = after.split('\n');
  const out: { type: 'same' | 'add' | 'del'; text: string }[] = [];
  const setB = new Set(b);
  for (const line of a) if (!setB.has(line)) out.push({ type: 'del', text: line });
  const setA = new Set(a);
  for (const line of b) out.push(setA.has(line) ? { type: 'same', text: line } : { type: 'add', text: line });
  return out.slice(0, 400);
}

export function DiffModal(): JSX.Element {
  const { pendingDiff, setPendingDiff, upsertFile, files, pushUndo } = useIde();
  if (!pendingDiff) return <></>;
  const rows = diffLines(pendingDiff.before, pendingDiff.after);
  const accept = (): void => {
    const exists = files.some((f) => f.name === pendingDiff.fileName);
    if (!exists) {
      useIde.getState().createFile(pendingDiff.fileName);
      pushUndo(pendingDiff.fileName, '');
    } else {
      pushUndo(pendingDiff.fileName, pendingDiff.before);
    }
    upsertFile(pendingDiff.fileName, pendingDiff.after);
    useIde.getState().setActiveFile(pendingDiff.fileName);
    setPendingDiff(null);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} role="dialog" aria-label="Review diff">
      <div className="vs-card max-w-3xl w-full max-h-[80vh] overflow-auto" style={{ background: 'var(--vs-bg)' }}>
        <h3 className="font-bold">Review: {pendingDiff.label} → {pendingDiff.fileName}</h3>
        <p className="text-xs opacity-70">Nothing is overwritten until you Accept. Esc cancels.</p>
        <pre className="text-xs mt-2 font-mono whitespace-pre-wrap">
          {rows.map((r, i) => (
            <div key={i} style={{ background: r.type === 'add' ? 'rgba(0,200,0,0.12)' : r.type === 'del' ? 'rgba(200,0,0,0.12)' : 'transparent' }}>
              {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '} {r.text}
            </div>
          ))}
        </pre>
        <div className="flex gap-2 mt-3">
          <button className="vs-btn" onClick={accept}>Accept</button>
          <button className="vs-btn-ghost" onClick={() => setPendingDiff(null)}>Reject (Esc)</button>
        </div>
      </div>
    </div>
  );
}

export function useEscCancel(): void {
  useState(() => {
    if (typeof window === 'undefined') return undefined;
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') useIde.getState().setPendingDiff(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
}
