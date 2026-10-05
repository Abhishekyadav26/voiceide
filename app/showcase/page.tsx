import Link from 'next/link';

const LANDINGS = ['terminal', 'clean', 'gradient', 'editorial'];
const LAYOUTS = ['classic', 'command-first', 'split', 'wizard'];

export default function Showcase(): JSX.Element {
  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">Showcase — all variants side by side</h1>
      <p className="opacity-70 text-sm mt-1">Each card links to its live shareable URL.</p>
      <h2 className="text-xl font-bold mt-6">Landing variants</h2>
      <div className="grid md:grid-cols-2 gap-3 mt-2">
        {LANDINGS.map((l) => (
          <Link key={l} href={`/?landing=${l}`} className="vs-card block">
            <b className="capitalize">{l}</b>
            <div className="text-xs opacity-60">/?landing={l}</div>
            <div className="mt-2 h-24 rounded overflow-hidden border" style={{ borderColor: 'var(--vs-border)' }}>
              <span className="text-xs opacity-50 p-2">thumbnail · {l}</span>
            </div>
          </Link>
        ))}
      </div>
      <h2 className="text-xl font-bold mt-6">IDE layouts</h2>
      <div className="grid md:grid-cols-2 gap-3 mt-2">
        {LAYOUTS.map((l) => (
          <Link key={l} href={`/app?layout=${l}`} className="vs-card block">
            <b className="capitalize">{l}</b>
            <div className="text-xs opacity-60">/app?layout={l}</div>
            <div className="mt-2 h-24 rounded overflow-hidden border" style={{ borderColor: 'var(--vs-border)' }}>
              <span className="text-xs opacity-50 p-2">thumbnail · {l}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
