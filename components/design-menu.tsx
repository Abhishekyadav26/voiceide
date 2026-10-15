'use client';
import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDesign, type LandingVariant, type IdeLayout } from '@/lib/store/design';

const LANDINGS: LandingVariant[] = ['metabox', 'terminal', 'clean', 'gradient', 'editorial'];
const THEMES = ['metabox', 'terminal', 'clean', 'gradient', 'editorial'];
const LAYOUTS: IdeLayout[] = ['classic', 'command-first', 'split', 'wizard'];

export function DesignMenu(): JSX.Element {
  const { landing, layout, theme, mode, demoMode, setLanding, setLayout, setTheme, setMode } = useDesign();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768);
  if (!demoMode && params.get('demo') !== '1') return <></>;

  const share = (key: string, value: string): void => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  if (!open) {
    return (
      <button className="fixed bottom-3 right-3 z-50 vs-btn-ghost text-xs" style={{ background: 'var(--vs-card)' }} onClick={() => setOpen(true)} aria-label="Open design switcher">
        Design
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 vs-card flex flex-col gap-2 text-xs max-h-[70vh] overflow-auto" aria-label="Design switcher">
      <span className="font-bold flex items-center justify-between gap-4">Design
        <button className="vs-btn-ghost px-2 py-0.5" onClick={() => setOpen(false)} aria-label="Close design switcher">✕</button>
      </span>
      <label>Landing
        <select className="vs-input ml-1" value={landing} onChange={(e) => { setLanding(e.target.value as LandingVariant); share('landing', e.target.value); }}>
          {LANDINGS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <label>Layout
        <select className="vs-input ml-1" value={layout} onChange={(e) => { setLayout(e.target.value as IdeLayout); share('layout', e.target.value); }}>
          {LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <label>Theme
        <select className="vs-input ml-1" value={theme} onChange={(e) => setTheme(e.target.value as never)}>
          {THEMES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <button className="vs-btn-ghost" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        {mode === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </div>
  );
}
