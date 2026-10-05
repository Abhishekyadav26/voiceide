'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IdeClassic } from '@/components/ide-classic';
import { CommandBar } from '@/components/command-bar';
import { FileTree } from '@/components/file-tree';
import { RightPanel } from '@/components/right-panel';
import { NetworkBanner } from '@/components/network-banner';
import { DiffModal } from '@/components/diff-modal';
import dynamic from 'next/dynamic';
import { useDesign, type IdeLayout } from '@/lib/store/design';
import { useIde } from '@/lib/store/ide';

const EditorPane = dynamic(() => import('@/components/editor-pane').then((m) => m.EditorPane), { ssr: false });

function CommandFirst(): JSX.Element {
  return (
    <div className="h-screen flex flex-col">
      <NetworkBanner />
      <div className="flex flex-1 min-h-0">
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-[40%] overflow-auto"><CommandBar /></div>
          <div className="flex-1 min-h-0 border-t" style={{ borderColor: 'var(--vs-border)' }}><EditorPane /></div>
        </main>
        <aside className="w-80 border-l overflow-auto" style={{ borderColor: 'var(--vs-border)' }}>
          <FileTree /><RightPanel />
        </aside>
      </div>
      <DiffModal />
    </div>
  );
}

function Split(): JSX.Element {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 border-b text-xs" style={{ borderColor: 'var(--vs-border)' }}>
        <button className="vs-btn-ghost" onClick={() => setDrawer((d) => !d)}>☰ Files</button>
        <b>VoiceSol</b>
      </div>
      <NetworkBanner />
      <div className="flex flex-1 min-h-0">
        {drawer && <aside className="w-56 border-r overflow-auto" style={{ borderColor: 'var(--vs-border)' }}><FileTree /></aside>}
        <main className="flex-1 min-w-0 flex flex-col"><EditorPane /><CommandBar /></main>
        <aside className="w-96 border-l overflow-auto" style={{ borderColor: 'var(--vs-border)' }}><RightPanel /></aside>
      </div>
      <DiffModal />
    </div>
  );
}

const STEPS = ['Write', 'Compile', 'Deploy', 'Interact'] as const;

function Wizard(): JSX.Element {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const h = (e: Event): void => {
      const dir = (e as CustomEvent).detail as string;
      setStep((s) => dir === 'next' ? Math.min(3, s + 1) : Math.max(0, s - 1));
    };
    window.addEventListener('vs-step', h);
    return () => window.removeEventListener('vs-step', h);
  }, []);
  return (
    <div className="h-screen flex flex-col">
      <NetworkBanner />
      <div className="flex gap-2 p-2 text-xs" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className="flex-1 px-2 py-1 rounded" style={{ background: i === step ? 'var(--vs-accent)' : 'var(--vs-muted)' }}>
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2">
        {step === 0 && <div className="grid md:grid-cols-[200px_1fr] gap-2 h-full"><FileTree /><EditorPane /></div>}
        {step !== 0 && <RightPanel />}
      </div>
      <div className="flex gap-2 p-2">
        <button className="vs-btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
        <button className="vs-btn" disabled={step === 3} onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
      </div>
      <CommandBar />
      <DiffModal />
    </div>
  );
}

function AppInner(): JSX.Element {
  const params = useSearchParams();
  const { layout, setLayout } = useDesign();
  useEffect(() => {
    const q = params.get('layout') as IdeLayout | null;
    if (q && ['classic', 'command-first', 'split', 'wizard'].includes(q)) setLayout(q);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') useIde.getState().setPendingDiff(null);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void useIde.getState().persist(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  useEffect(() => {
    if (window.innerWidth < 1100 && (layout === 'classic' || layout === 'command-first')) setLayout('split');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (layout === 'command-first') return <CommandFirst />;
  if (layout === 'split') return <Split />;
  if (layout === 'wizard') return <Wizard />;
  return <IdeClassic />;
}

export default function AppPage(): JSX.Element {
  return (
    <Suspense fallback={<main className="p-10">Loading IDE…</main>}>
      <AppInner />
    </Suspense>
  );
}
