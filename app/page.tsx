'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDesign, type LandingVariant } from '@/lib/store/design';
import { Marquee } from '@/components/magic/marquee';
import { ShimmerButton } from '@/components/magic/shimmer-button';
import { ShinyText } from '@/components/magic/shiny-text';
import { GlowingCards } from '@/components/glowing-cards';

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

const MB_STACK = ['Base Sepolia · 84532', 'Solidity 0.8.24', 'OpenZeppelin v5', 'viem + wagmi', 'RainbowKit', 'Groq parsing', 'solc in-browser', 'Basescan verify'];
const MB_TEMPLATES: [string, string][] = [
  ['ERC-20', 'Fixed-supply fungible token'],
  ['ERC-721', 'Capped-supply NFT collection'],
  ['ERC-1155', 'Multi-token with per-id URIs'],
  ['Vault', 'Simple ETH deposit vault'],
  ['Multisig', 'M-of-N approval wallet'],
  ['Crowdfunding', 'Goal + deadline campaign'],
];

function MbCode(): JSX.Element {
  const kw = '#c792ea'; const str = '#9ece6a'; const com = '#565f89'; const fn = '#e0af68'; const pl = '#c0caf5'; const ty = '#7dcfff';
  const L = (n: number, body: React.ReactNode): JSX.Element => (
    <div className="flex"><span className="w-8 shrink-0 text-right pr-3 select-none" style={{ color: '#3b3f5c' }}>{n}</span><span className="whitespace-pre">{body}</span></div>
  );
  return (
    <div className="mb-code" style={{ color: pl }}>
      {L(1, <span><span style={{ color: com }}>{'// Dictated: "write a hello contract"'}</span></span>)}
      {L(2, <span><span style={{ color: kw }}>pragma solidity</span> ^0.8.20;</span>)}
      {L(3, <span> </span>)}
      {L(4, <span><span style={{ color: kw }}>contract</span> <span style={{ color: ty }}>Hello</span> {'{'}</span>)}
      {L(5, <span>{'    '}<span style={{ color: ty }}>string</span> <span style={{ color: kw }}>public</span> greeting = <span style={{ color: str }}>{'"Hello"'}</span>;</span>)}
      {L(6, <span> </span>)}
      {L(7, <span>{'    '}<span style={{ color: kw }}>function</span> <span style={{ color: fn }}>setGreeting</span>(<span style={{ color: ty }}>string</span> <span style={{ color: kw }}>calldata</span> next) <span style={{ color: kw }}>external</span> {'{'}</span>)}
      {L(8, <span>{'        '}greeting = next;</span>)}
      {L(9, <span>{'    }'}</span>)}
      {L(10, <span>{'}'}</span>)}
    </div>
  );
}

function EditorMock(): JSX.Element {
  return (
    <div className="mb-window">
      <div className="mb-window-bar">
        <span className="mb-traffic" style={{ background: '#ff5f57' }} />
        <span className="mb-traffic" style={{ background: '#febc2e' }} />
        <span className="mb-traffic" style={{ background: '#28c840' }} />
        <span className="ml-2">VoiceSol IDE — Hello.sol</span>
        <span className="ml-auto hidden sm:inline">Base Sepolia · 84532</span>
      </div>
      <div className="grid md:grid-cols-[180px_1fr_190px]">
        <div className="hidden md:block p-3 text-xs border-r" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(244,244,245,0.7)' }}>
          <div className="opacity-50 mb-2">FILES</div>
          {['Hello.sol', 'SolCoin.sol', 'Vault.sol'].map((f, i) => (
            <div key={f} className="px-2 py-1 rounded" style={i === 0 ? { background: 'rgba(94,234,212,0.12)', color: '#fff' } : undefined}>{f}</div>
          ))}
        </div>
        <div className="p-4 overflow-x-auto"><MbCode /></div>
        <div className="hidden md:block p-3 text-xs border-l space-y-2" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(244,244,245,0.7)' }}>
          <div className="opacity-50">PANEL</div>
          {['Compiler ✅ clean', 'Deploy → wallet', 'Interact ƒ balanceOf'].map((t) => (
            <div key={t} className="px-2 py-1.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{t}</div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(244,244,245,0.75)' }}>
        <div>heard: <span style={{ color: '#fff' }}>write a hello contract</span></div>
        <div>understood as: <span className="mb-accent">write_contract → diff ready</span></div>
      </div>
    </div>
  );
}

function Metabox(): JSX.Element {
  const router = useRouter();
  const goApp = (): void => router.push('/app');
  return (
    <main className="mb-page mb-dots">
      <div>
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center justify-between py-5">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-extrabold text-lg">◉ VoiceSol</Link>
              <div className="mb-nav hidden md:flex">
                <a href="#how">How it works</a>
                <a href="#templates">Templates</a>
                <Link href="/showcase">Showcase</Link>
              </div>
            </div>
            <ShimmerButton onClick={goApp}>Launch App <span aria-hidden>→</span></ShimmerButton>
          </nav>
          <div className="mt-4">
            <span className="mb-pill"><span className="mb-pill-new">New</span><ShinyText>Voice commands now parse offline with local fallback</ShinyText></span>
          </div>
          <section className="grid md:grid-cols-[1fr_320px] gap-10 mt-10 items-start">
            <h1 className="mb-h1"><span className="mb-grad">Speak.</span><br /><span className="mb-grad">Compile.</span><br /><span className="mb-grad">Deploy.</span></h1>
            <div className="text-sm leading-relaxed" style={{ color: 'rgba(244,244,245,0.75)' }}>
              <p className="font-semibold text-white">Ship contracts by voice</p>
              <p className="mt-2">Dictate commands into VoiceSol IDE — it writes the code, shows a diff, compiles in your browser, and deploys to Base Sepolia.</p>
              <p className="mt-4"><span className="mb-dot">●</span>Review every diff before it lands</p>
              <p className="mt-1"><span className="mb-dot">●</span>One-click verify on Basescan</p>
              <Link className="mb-cta mt-5" href="/app">Open the IDE <span aria-hidden>→</span></Link>
            </div>
          </section>
          <p className="mb-eyebrow text-center mt-16">BUILT FOR BASE SEPOLIA</p>
          <div className="relative mt-2 pb-4">
            <Marquee pauseOnHover duration="32s">
              {MB_STACK.map((s) => <span key={s} className="mb-chip">{s}</span>)}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24" style={{ background: 'linear-gradient(to right, #0a0a0d, transparent)' }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24" style={{ background: 'linear-gradient(to left, #0a0a0d, transparent)' }} />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 mt-10 pb-20"><EditorMock /></div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="mb-eyebrow">DEVELOPMENT PROCESS, BY VOICE</p>
        <p className="mt-6 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto" style={{ color: 'rgba(244,244,245,0.9)' }}>
          Dictate your contract in plain words and edit whatever you want. Speech becomes a reviewed diff, so only code you accept reaches the compiler — <Link href="/app" className="mb-accent underline">open the IDE</Link>.
        </p>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="mb-eyebrow">ANYWHERE &amp; ANYTIME</p>
          <h2 className="mb-h2 mt-3">Voice-first Solidity in your browser</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(244,244,245,0.7)' }}>
            Prototype by speaking, then grow it into a full project. No wallet keys in the app, no typing required — compile, deploy, and interact from the same command bar.
          </p>
          <Link className="mb-cta mt-6" href="/app">Open the IDE <span aria-hidden>→</span></Link>
        </div>
        <div className="mb-window p-5 text-sm space-y-3">
          {[['🎙️ Dictate', '“write an ERC-20 called Sol Coin…”'], ['🧾 Parse', 'Groq intent JSON + local fallback'], ['🔨 Compile', 'solc 0.8.24 + OpenZeppelin v5'], ['🚀 Deploy', 'wallet signs on Base Sepolia'], ['✅ Verify', 'one click on Basescan']].map(([t, d]) => (
            <div key={t} className="flex gap-3 items-baseline">
              <b className="whitespace-nowrap">{t}</b>
              <span style={{ color: 'rgba(244,244,245,0.65)' }}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="mb-band-blue">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-bold" style={{ letterSpacing: '0.32em', opacity: 0.6 }}>TEMPLATES</p>
          <h2 className="mb-h2 mt-3 max-w-2xl">Production-grade starting points for every standard.</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-8">
            {MB_TEMPLATES.map(([t, d]) => (
              <div key={t} className="mb-tcard"><b>{t}</b><p className="text-sm mt-1" style={{ opacity: 0.75 }}>{d}</p></div>
            ))}
          </div>
          <Link className="mb-cta mt-8" href="/app">Browse in the IDE <span aria-hidden>→</span></Link>
        </div>
      </section>

      <section className="mb-band-blue mb-dots-light">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-bold" style={{ letterSpacing: '0.32em', opacity: 0.6 }}>VERIFY &amp; SHIP</p>
          <h2 className="mb-h2 mt-3 max-w-2xl">Verified on Basescan before you finish your sentence.</h2>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            {[
              ['Submit', 'Standard JSON goes to Basescan straight from the Deploy tab.'],
              ['Poll', 'Status is polled until it reads Verified — or fails loudly.'],
              ['Trust', 'AI reviews are clearly labeled — never a security audit.'],
            ].map(([t, d]) => (
              <div key={t} className="mb-tcard"><b>{t}</b><p className="text-sm mt-1" style={{ opacity: 0.75 }}>{d}</p></div>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-sm leading-relaxed" style={{ opacity: 0.8 }}>
            After deployment, submit standard JSON to Basescan from the Deploy tab and poll until it reads “Verified”.
          </p>
          <Link className="mb-cta mt-8" href="/app">Try a deploy <span aria-hidden>→</span></Link>
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="mb-eyebrow">EASY TO USE</p>
          <h2 className="mb-h2 mt-4">Deploy anywhere,<br />with <span className="mb-accent">VoiceSol</span></h2>
          <div className="relative mt-8">
            <Marquee pauseOnHover reverse duration="36s">
              {MB_STACK.map((s) => <span key={s} className="mb-chip">{s}</span>)}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24" style={{ background: 'linear-gradient(to right, #0a0a0d, transparent)' }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24" style={{ background: 'linear-gradient(to left, #0a0a0d, transparent)' }} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <p className="mb-eyebrow text-center">FROM VOICE TO BASE SEPOLIA</p>
        <div className="mt-6"><GlowingCards /></div>
        <div className="text-center mt-10"><ShimmerButton onClick={goApp} shimmerColor="#ffffff" background="rgba(244,244,245,0.08)"><span style={{ color: '#fff' }}>{COPY.cta}</span> <span aria-hidden style={{ color: '#fff' }}>→</span></ShimmerButton></div>
      </section>

      <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-3 items-center justify-between text-xs" style={{ color: 'rgba(244,244,245,0.55)' }}>
          <span>◉ VoiceSol IDE · Base Sepolia 84532</span>
          <span>Speak Solidity. Ship on Base Sepolia.</span>
          <Link href="/app" className="underline">{COPY.cta}</Link>
        </div>
      </footer>
    </main>
  );
}

function LandingInner(): JSX.Element {
  const params = useSearchParams();
  const { landing, setLanding } = useDesign();
  useEffect(() => {
    const q = params.get('landing') as LandingVariant | null;
    if (q && ['terminal', 'clean', 'gradient', 'editorial', 'metabox'].includes(q)) setLanding(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  if (landing === 'clean') return <Clean />;
  if (landing === 'gradient') return <Gradient />;
  if (landing === 'editorial') return <Editorial />;
  if (landing === 'terminal') return <Terminal />;
  return <Metabox />;
}

export default function LandingPage(): JSX.Element {
  return (
    <Suspense fallback={<main className="p-10">Loading…</main>}>
      <LandingInner />
    </Suspense>
  );
}
