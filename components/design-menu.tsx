'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDesign, type LandingVariant, type IdeLayout } from '@/lib/store/design';

const LANDINGS: LandingVariant[] = ['terminal', 'clean', 'gradient', 'editorial'];
const LAYOUTS: IdeLayout[] = ['classic', 'command-first', 'split', 'wizard'];

export function DesignMenu(): JSX.Element {
  const { landing, layout, theme, mode, demoMode, setLanding, setLayout, setTheme, setMode } = useDesign();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  if (!demoMode && params.get('demo') !== '1') return <></>;

  const share = (key: string, value: string): void => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 vs-card flex flex-col gap-2 text-xs" aria-label="Design switcher">
      <span className="font-bold">Design</span>
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
          {LANDINGS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <button className="vs-btn-ghost" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        {mode === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </div>
  );
}
