import { create } from 'zustand';

export type LandingVariant = 'terminal' | 'clean' | 'gradient' | 'editorial' | 'metabox';
export type IdeLayout = 'classic' | 'command-first' | 'split' | 'wizard';
export type IdeTheme = 'terminal' | 'clean' | 'gradient' | 'editorial' | 'metabox';
export type ColorMode = 'dark' | 'light';

interface DesignState {
  landing: LandingVariant;
  layout: IdeLayout;
  theme: IdeTheme;
  mode: ColorMode;
  demoMode: boolean;
  hydrated: boolean;
  setLanding: (v: LandingVariant) => void;
  setLayout: (v: IdeLayout) => void;
  setTheme: (v: IdeTheme) => void;
  setMode: (v: ColorMode) => void;
  setDemoMode: (v: boolean) => void;
  hydrate: () => void;
}

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const useDesign = create<DesignState>()((setState) => ({
  landing: 'metabox',
  layout: 'classic',
  theme: 'metabox',
  mode: 'dark',
  demoMode: true,
  hydrated: false,
  setLanding: (landing) => { setState({ landing }); try { localStorage.setItem('vs-landing', landing); } catch {} },
  setLayout: (layout) => { setState({ layout }); try { localStorage.setItem('vs-layout', layout); } catch {} },
  setTheme: (theme) => { setState({ theme }); try { localStorage.setItem('vs-theme', theme); } catch {} },
  setMode: (mode) => { setState({ mode }); try { localStorage.setItem('vs-mode', mode); } catch {} },
  setDemoMode: (demoMode) => setState({ demoMode }),
  // Only keys actually stored override the defaults, so explicit ?landing= / ?layout=
  // params applied later always win over defaults but never lose to them.
  hydrate: () => setState((s) => {
    const next: Partial<DesignState> = { hydrated: true };
    const landing = stored('vs-landing');
    const layout = stored('vs-layout');
    const theme = stored('vs-theme');
    const mode = stored('vs-mode');
    if (landing) next.landing = landing as DesignState['landing'];
    if (layout) next.layout = layout as DesignState['layout'];
    if (theme) next.theme = theme as DesignState['theme'];
    if (mode) next.mode = mode as DesignState['mode'];
    void s;
    return next;
  }),
}));
