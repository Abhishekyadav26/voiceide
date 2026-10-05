import { create } from 'zustand';

export type LandingVariant = 'terminal' | 'clean' | 'gradient' | 'editorial';
export type IdeLayout = 'classic' | 'command-first' | 'split' | 'wizard';
export type IdeTheme = 'terminal' | 'clean' | 'gradient' | 'editorial';
export type ColorMode = 'dark' | 'light';

interface DesignState {
  landing: LandingVariant;
  layout: IdeLayout;
  theme: IdeTheme;
  mode: ColorMode;
  demoMode: boolean;
  setLanding: (v: LandingVariant) => void;
  setLayout: (v: IdeLayout) => void;
  setTheme: (v: IdeTheme) => void;
  setMode: (v: ColorMode) => void;
  setDemoMode: (v: boolean) => void;
  hydrate: () => void;
}

function read<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (v as T) ?? fallback;
  } catch { return fallback; }
}

export const useDesign = create<DesignState>()((setState) => ({
  landing: 'terminal',
  layout: 'classic',
  theme: 'terminal',
  mode: 'dark',
  demoMode: true,
  setLanding: (landing) => { setState({ landing }); try { localStorage.setItem('vs-landing', landing); } catch {} },
  setLayout: (layout) => { setState({ layout }); try { localStorage.setItem('vs-layout', layout); } catch {} },
  setTheme: (theme) => { setState({ theme }); try { localStorage.setItem('vs-theme', theme); } catch {} },
  setMode: (mode) => { setState({ mode }); try { localStorage.setItem('vs-mode', mode); } catch {} },
  setDemoMode: (demoMode) => setState({ demoMode }),
  hydrate: () => setState({
    landing: read('vs-landing', 'terminal'),
    layout: read('vs-layout', 'classic'),
    theme: read('vs-theme', 'terminal'),
    mode: read('vs-mode', 'dark'),
  }),
}));
