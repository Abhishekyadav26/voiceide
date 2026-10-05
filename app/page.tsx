'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDesign, type LandingVariant } from '@/lib/store/design';

const COPY = {
  headline: 'Speak Solidity. Ship on Base Sepolia.',
  sub: 'VoiceSol IDE turns dictated commands into compiled, deployed, verified smart contracts — no typing required.',
  cta: 'Launch App',
};

function useTyping(text: string, speed = 45): string {
  const [out, setOut] = useState('');
  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setOut(text); return; }
    setOut('');
    let i = 0;
    const t = setInterval(() => { i += 1; setOut(text.slice(0, i)); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return out;
}

const CODE_SAMPLE = `contract SolCoin is ERC20 {
  uint256 constant SUPPLY = 1000000 * 10**18;
  constructor() ERC20("Sol Coin", "SOL") {
    _mint(msg.sender, SUPPLY);
  }
}`;

function Badge(): JSX.Element {
  return <span className="voice-badge">Built by voice with Wispr Flow</span>;
}

function Terminal(): JSX.Element {
  const cmd = useTyping('write an ERC-20 called Sol Coin', 60);
  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto font-mono">
      <nav className="flex justify-between items-center py-4"><span className="font-bold">$ voicesol</span><Link className="vs-btn" href="/app">{COPY.cta}</Link></nav>
      <section className="mt-10 grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm opacity-70">&gt; wispr-flow --listen</p>
          <h1 className="text-4xl font-bold mt-2">{COPY.headline}</h1>
          <p className="mt-3 opacity-80">{COPY.sub}</p>
          <p className="mt-4">&gt; {cmd}<span className="typing-caret">▌</span></p>
          <Link className="vs-btn inline-block mt-6" href="/app">{COPY.cta}</Link>
          <div className="mt-4"><Badge /></div>
        </div>
        <pre className="vs-card text-xs overflow-auto whitespace-pre-wrap">{CODE_SAMPLE}</pre>
      </section>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12">
        {['Speak', 'Review', 'Compile', 'Deploy'].map((s, i) => (
          <div key={s} className="vs-card"><b>{i + 1}. {s}</b><p className="text-xs opacity-70 mt-1">Dictate, accept the diff, compile in-browser, deploy to Base Sepolia.</p></div>
        ))}
      </section>
      <section className="grid md:grid-cols-3 gap-3 mt-6">
        {['Voice command bar', 'In-browser solc 0.8.24', 'One-click verify'].map((f) => <div key={f} className="vs-card text-sm">{f}</div>)}
      </section>
      <section className="mt-6 vs-card text-sm">Templates: ERC-20 · ERC-721 · ERC-1155 · Vault · Multisig · Crowdfunding</section>
      <footer className="mt-10 text-xs opacity-60">VoiceSol IDE · Base Sepolia 84532 · <Badge /></footer>
    </main>
  );
}

function Clean(): JSX.Element {
  return (
    <main className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto p-6">
        <nav className="flex justify-between items-center py-4"><span className="font-bold text-indigo-600">VoiceSol</span><Link className="vs-btn" href="/app">{COPY.cta}</Link></nav>
        <section className="text-center mt-10">
          <h1 className="text-5xl font-extrabold">{COPY.headline}</h1>
          <p className="mt-4 text-gray-600">{COPY.sub}</p>
          <Link className="vs-btn inline-block mt-6" href="/app">{COPY.cta}</Link>
          <div className="mt-3"><Badge /></div>
        </section>
        <section className="mt-10 border rounded-xl p-4 bg-gray-50 shadow-sm">
          <div className="text-xs text-gray-500 mb-2">IDE preview</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white border rounded p-2">SolCoin.sol<br />Vault.sol</div>
            <div className="bg-gray-900 text-green-300 rounded p-2 font-mono whitespace-pre-wrap">{CODE_SAMPLE}</div>
            <div className="bg-white border rounded p-2">Compiler ✓<br />Deploy →<br />Interact ƒ</div>
          </div>
        </section>
        <section className="grid md:grid-cols-3 gap-4 mt-10">
          {[['Dictate', 'Speak commands via Wispr Flow.'], ['Compile', 'solc 0.8.24 in a Web Worker.'], ['Deploy', 'Viem + wallet to Base Sepolia.']].map(([t, d]) => (
            <div key={t} className="border rounded-xl p-4 bg-gray-50"><b>{t}</b><p className="text-sm text-gray-600 mt-1">{d}</p></div>
          ))}
        </section>
        <section className="mt-10 overflow-auto">
          <table className="w-full text-sm border">
            <thead><tr className="bg-gray-100"><th className="p-2 text-left">Task</th><th className="p-2">Typing</th><th className="p-2">Voice</th></tr></thead>
            <tbody>
              {[['ERC-20 scaffold', '12 min', '20 sec'], ['Constructor form', 'manual', 'auto'], ['Verify on Basescan', '8 steps', '1 click']].map(([a, b, c]) => (
                <tr key={a} className="border-t"><td className="p-2">{a}</td><td className="p-2 text-center">{b}</td><td className="p-2 text-center font-bold text-indigo-600">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-bold">FAQ</h2>
          {[['Do I need keys in the app?', 'No. All signing happens in your wallet.'], ['Which network?', 'Base Sepolia (84532) only.'], ['Is the audit real?', 'No — it is an AI review, not a security audit.']].map(([q, a]) => (
            <div key={q} className="mt-2"><b className="text-sm">{q}</b><p className="text-sm text-gray-600">{a}</p></div>
          ))}
        </section>
        <div className="text-center mt-10"><Link className="vs-btn" href="/app">Start building — {COPY.cta}</Link></div>
        <footer className="mt-10 text-xs text-gray-500"><Badge /></footer>
      </div>
    </main>
  );
}

function Gradient(): JSX.Element {
  return (
    <main className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0a1030,#2b1a5e,#0a3a6e)', color: '#eef2ff', fontFamily: 'Space Grotesk, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        <nav className="flex justify-between items-center py-4"><span className="font-bold">◉ VoiceSol</span><Link className="vs-btn" href="/app">{COPY.cta}</Link></nav>
        <section className="text-center mt-12">
          <div className="flex justify-center gap-1 h-10 items-center" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="wave-bar inline-block w-1 rounded" style={{ height: `${12 + (i % 5) * 8}px`, background: '#a855f7', animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <h1 className="text-5xl font-bold mt-4">Say it. Ship it.</h1>
          <p className="mt-3 opacity-80">{COPY.sub}</p>
          <div className="mt-4 flex gap-2 justify-center text-xs">
            <span className="voice-badge">Base Sepolia · 84532</span><Badge />
          </div>
          <Link className="vs-btn inline-block mt-6" href="/app">{COPY.cta}</Link>
        </section>
        <section className="flex flex-wrap justify-center gap-2 mt-12 text-sm">
          {['Dictate', 'Parse', 'Compile', 'Deploy', 'Verify'].map((s, i) => (
            <span key={s} className="pipe-node glass rounded-full px-4 py-2" style={{ animationDelay: `${i * 0.3}s` }}>{s}{i < 4 ? ' →' : ''}</span>
          ))}
        </section>
        <footer className="mt-12 text-xs opacity-70 text-center"><Badge /></footer>
      </div>
    </main>
  );
}

function Editorial(): JSX.Element {
  return (
    <main className="min-h-screen p-6" style={{ background: '#faf7f0', color: '#111', fontFamily: 'Fraunces, serif' }}>
      <div className="max-w-3xl mx-auto">
        <nav className="flex justify-between items-center py-6"><span>VoiceSol IDE</span><Link href="/app" style={{ background: '#ff5c00', color: '#fff', padding: '0.5rem 1rem', borderRadius: 4 }}>{COPY.cta}</Link></nav>
        <h1 className="mt-10" style={{ fontSize: '3.5rem', lineHeight: 1.05 }}>The contract is a conversation.</h1>
        <p className="mt-4 text-lg">{COPY.sub}</p>
        <ol className="mt-8 space-y-2">
          <li><b>1.</b> Say what you want.</li>
          <li><b>2.</b> Review the diff.</li>
          <li><b>3.</b> Ship to Base Sepolia.</li>
        </ol>
        <div className="mt-8 border p-8 text-center" style={{ borderColor: '#e2d9c8' }}>[ demo video placeholder — 16:9 ]</div>
        <div className="mt-6"><Link href="/app" style={{ background: '#ff5c00', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 4 }}>{COPY.cta}</Link></div>
        <footer className="mt-12 text-sm opacity-70">Minimal footer · <Badge /></footer>
      </div>
    </main>
  );
}

function LandingInner(): JSX.Element {
  const params = useSearchParams();
  const { landing, setLanding } = useDesign();
  useEffect(() => {
    const q = params.get('landing') as LandingVariant | null;
    if (q && ['terminal', 'clean', 'gradient', 'editorial'].includes(q)) setLanding(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  if (landing === 'clean') return <Clean />;
  if (landing === 'gradient') return <Gradient />;
  if (landing === 'editorial') return <Editorial />;
  return <Terminal />;
}

export default function LandingPage(): JSX.Element {
  return (
    <Suspense fallback={<main className="p-10">Loading…</main>}>
      <LandingInner />
    </Suspense>
  );
}
