'use client';
import { useState } from 'react';
import { useIde } from '@/lib/store/ide';
import { APP_CONFIG } from '@/lib/config';
import { addressUrl, txUrl } from '@/lib/chain/config';
import { getConstructorInputs, validateArg, coerceArg, deployEnabled } from '@/lib/chain/validate';
import { useAccount, useBalance, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { encodeDeployData, type Abi } from 'viem';
import { runCompile } from './command-bar';

const TABS = ['compiler', 'deploy', 'interact', 'history'] as const;

export function RightPanel(): JSX.Element {
  const [tab, setTab] = useState<(typeof TABS)[number]>('compiler');
  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex gap-1 p-1 border-b" style={{ borderColor: 'var(--vs-border)' }} role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" data-tab={t} aria-selected={tab === t} onClick={() => setTab(t)}
            className="px-2 py-1 text-xs rounded capitalize" style={{ background: tab === t ? 'var(--vs-muted)' : 'transparent' }}>
            {t === 'compiler' ? 'Compiler' : t === 'deploy' ? 'Deploy' : t === 'interact' ? 'Interact' : 'History'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-2">
        {tab === 'compiler' && <CompilerTab />}
        {tab === 'deploy' && <DeployTab />}
        {tab === 'interact' && <InteractTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}

function CompilerTab(): JSX.Element {
  const { compileResult, compiling, progress, files, activeFile, explainText, auditText } = useIde();
  const errs = compileResult?.errors ?? [];
  const warns = compileResult?.warnings ?? [];
  return (
    <div className="space-y-2 text-xs">
      <button className="vs-btn w-full" disabled={compiling} onClick={() => void runCompile()}>
        {compiling ? `Compiling… ${progress}` : 'Compile (solc 0.8.24)'}
      </button>
      {compileResult && (
        <div>Done in {compileResult.compileTimeMs}ms · {compileResult.success ? '✅ clean' : `❌ ${errs.length} error(s)`} · {warns.length} warning(s)</div>
      )}
      {errs.map((e, i) => <div key={i} className="vs-card">❌ <b>{e.file}:{e.line}:{e.column}</b> {e.message.slice(0, 300)}</div>)}
      {warns.map((w, i) => <div key={i} className="vs-card">⚠️ <b>{w.file}:{w.line}:{w.column}</b> {w.message.slice(0, 300)}</div>)}
      {(compileResult?.contracts ?? []).map((c) => (
        <div key={c.name} className="vs-card">
          <b>{c.name}</b>
          <div>bytecode {(c.bytecodeSize / 1024).toFixed(1)} KB {c.bytecodeSize > APP_CONFIG.bytecodeSizeWarnBytes && <span>⚠️ above 24 KB limit</span>}</div>
          <button className="vs-btn-ghost mt-1" onClick={() => void navigator.clipboard.writeText(JSON.stringify(c.abi))}>Copy ABI</button>
        </div>
      ))}
      {explainText && <div className="vs-card"><b>Explanation</b><p className="whitespace-pre-wrap mt-1">{explainText}</p>
        <button className="vs-btn-ghost mt-1" onClick={() => { try { window.speechSynthesis.speak(new SpeechSynthesisUtterance(explainText.slice(0, 1000))); } catch {} }}>🔊 Read aloud</button></div>}
      {auditText && <div className="vs-card"><b>AI review (not a security audit)</b><p className="whitespace-pre-wrap mt-1">{auditText}</p></div>}
      <div className="opacity-60">Files: {files.length} · Active: {activeFile}</div>
    </div>
  );
}

function DeployTab(): JSX.Element {
  const { compileResult, constructorArgs, setConstructorArgs, addDeployment } = useIde();
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: wallet } = useWalletClient();
  const [sel, setSel] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [deployedAddr, setDeployedAddr] = useState('');
  const [busy, setBusy] = useState(false);

  const contracts = compileResult?.contracts ?? [];
  const current = contracts.find((c) => c.name === sel) ?? contracts[0];
  const inputs = current ? getConstructorInputs(current.abi) : [];
  const args: string[] = (current && constructorArgs[current.name]) ?? inputs.map(() => '');
  const argsValid = inputs.every((inp, i) => validateArg(inp.type, args[i] ?? '').ok);
  const gate = deployEnabled({
    compiledOk: !!compileResult?.success, chainId, balanceWei: balance?.value,
    estimatedGasWei: 500000n * 1000000000n, argsValid, expectedChainId: APP_CONFIG.chainId,
  });

  const deploy = async (): Promise<void> => {
    if (!current || !wallet || !publicClient || !address) { setStatus('Connect a wallet first.'); return; }
    if (chainId !== APP_CONFIG.chainId) { setStatus(`Refusing: wallet on chain ${chainId}, expected ${APP_CONFIG.chainId}.`); return; }
    if (!window.confirm(`Deploy ${current.name} to Base Sepolia with args [${args.join(', ')}]? This sends a transaction.`)) return;
    setBusy(true); setStatus('Sending deployment…');
    try {
      const coerced = inputs.map((inp, i) => coerceArg(inp.type, args[i] ?? ''));
      const data = encodeDeployData({ abi: current.abi, bytecode: current.bytecode as `0x${string}`, args: coerced as never[] });
      const hash = await wallet.sendTransaction({ to: undefined, data, chain: undefined });
      setTxHash(hash);
      setStatus(`Pending: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const addr = receipt.contractAddress ?? '';
      setDeployedAddr(addr);
      setStatus(`Deployed at ${addr} (block ${receipt.blockNumber})`);
      addDeployment({ name: current.name, address: addr, abi: current.abi as unknown[], constructorArgs: coerced as unknown[], txHash: hash, blockNumber: Number(receipt.blockNumber), timestamp: Date.now() });
    } catch (e) {
      const m = (e as Error).message;
      setStatus(/rejected|denied/i.test(m) ? 'Wallet rejected the transaction.' : `Deploy failed: ${m.slice(0, 300)}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 text-xs">
      {!compileResult?.success && <div className="vs-card">Compile successfully first (no errors).</div>}
      <select className="vs-input" value={current?.name ?? ''} onChange={(e) => setSel(e.target.value)} aria-label="Contract to deploy">
        {contracts.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      {inputs.map((inp, i) => {
        const v = validateArg(inp.type, args[i] ?? '');
        return (
          <label key={inp.name} className="block">{inp.name} ({inp.type})
            <input className="vs-input mt-0.5" value={args[i] ?? ''} placeholder={inp.type}
              onChange={(e) => { if (current) { const next = [...args]; next[i] = e.target.value; setConstructorArgs(current.name, next); } }} />
            {!v.ok && (args[i] ?? '') !== '' && <span className="text-red-500">{v.error}</span>}
          </label>
        );
      })}
      {!gate.enabled && <ul className="vs-card list-disc pl-4">{gate.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
      {current && <div className="vs-card">Summary: {current.name} · Base Sepolia · args [{args.join(', ')}] · est. gas ~500k</div>}
      <button className="vs-btn w-full" disabled={!gate.enabled || busy} onClick={() => void deploy()}>
        {busy ? 'Deploying…' : 'Deploy (wallet signs)'}
      </button>
      {status && <div className="vs-card break-all">{status}</div>}
      {txHash && <a className="underline break-all" href={txUrl(txHash)} target="_blank" rel="noreferrer">View tx on Basescan</a>}
      {deployedAddr && <a className="underline break-all block" href={addressUrl(deployedAddr)} target="_blank" rel="noreferrer">Contract: {deployedAddr}</a>}
      {deployedAddr && current && <VerifyBox address={deployedAddr} contractName={current.name} />}
    </div>
  );
}

function VerifyBox({ address, contractName }: { address: string; contractName: string }): JSX.Element {
  const { files } = useIde();
  const [msg, setMsg] = useState('');
  const verify = async (): Promise<void> => {
    setMsg('Submitting standard JSON…');
    const sources: Record<string, { content: string }> = {};
    for (const f of files) sources[f.name] = { content: f.content };
    const standardJson = JSON.stringify({
      language: 'Solidity',
      sources,
      settings: { optimizer: { enabled: true, runs: APP_CONFIG.optimizerRuns }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
    });
    const res = await fetch('/api/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', chainId: 84532, address, standardJson, contractName, compilerVersion: `v${APP_CONFIG.solcVersion}+commit.e11b9ed9` }),
    });
    const json = (await res.json()) as { result?: string; message?: string; error?: string };
    if (json.error) { setMsg(json.error); return; }
    const guid = json.result ?? '';
    setMsg(`Submitted (${guid}). Polling…`);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const st = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', chainId: 84532, guid }) });
      const sj = (await st.json()) as { result?: string };
      setMsg(`Status: ${sj.result}`);
      if (/already verified|verified/i.test(sj.result ?? '')) break;
      if (/fail/i.test(sj.result ?? '')) break;
    }
  };
  return <div className="vs-card"><button className="vs-btn-ghost" onClick={() => void verify()}>Verify on Basescan</button><div className="mt-1 break-all">{msg}</div></div>;
}

function InteractTab(): JSX.Element {
  const { deployments } = useIde();
  const [sel, setSel] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const [argInputs, setArgInputs] = useState<Record<string, string>>({});
  const publicClient = usePublicClient();
  const { data: wallet } = useWalletClient();
  const { address } = useAccount();

  const dep = deployments.find((d) => d.address === sel) ?? deployments[0];
  if (!dep) return <div className="text-xs opacity-70">No deployments yet. Deploy first, then call functions here.</div>;
  const abi = dep.abi as Abi;
  const fns = abi.filter((e) => e.type === 'function');

  const runFn = async (name: string, stateMutability: string, inputs: { name: string; type: string }[]): Promise<void> => {
    const raw = inputs.map((inp, i) => {
      let v = argInputs[`${name}:${i}`] ?? '';
      if (v === 'my address' && address) v = address;
      return v;
    });
    for (let i = 0; i < inputs.length; i++) {
      const v = validateArg(inputs[i]?.type ?? '', raw[i] ?? '');
      if (!v.ok) { setResults((r) => ({ ...r, [name]: `Invalid arg ${inputs[i]?.name}: ${v.error}` })); return; }
      const t = (inputs[i]?.type ?? '');
      if (t === 'address' && (raw[i] ?? '').toLowerCase() === 'my address' && !address) {
        setResults((r) => ({ ...r, [name]: 'Connect a wallet to resolve "my address".' })); return;
      }
    }
    const coerced = inputs.map((inp, i) => {
      let v = raw[i] ?? '';
      if (v.toLowerCase() === 'my address' && address) v = address;
      return coerceArg(inp.type, v);
    });
    try {
      if (stateMutability === 'view' || stateMutability === 'pure') {
        const out = await publicClient?.readContract({ address: dep.address as `0x${string}`, abi, functionName: name, args: coerced as never[] });
        setResults((r) => ({ ...r, [name]: String(out) }));
      } else {
        if (!window.confirm(`Send ${name}(${raw.join(', ')}) to ${dep.address}? This is a write transaction.`)) return;
        if (!wallet) { setResults((r) => ({ ...r, [name]: 'Connect a wallet first.' })); return; }
        const { request } = await publicClient!.simulateContract({ address: dep.address as `0x${string}`, abi, functionName: name, args: coerced as never[], account: address });
        const hash = await wallet.writeContract(request);
        setResults((r) => ({ ...r, [name]: `Sent: ${hash}` }));
      }
    } catch (e) {
      setResults((r) => ({ ...r, [name]: `Error: ${(e as Error).message.slice(0, 300)}` }));
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <select className="vs-input" value={dep.address} onChange={(e) => setSel(e.target.value)} aria-label="Select deployment">
        {deployments.map((d) => <option key={d.address} value={d.address}>{d.name} · {d.address.slice(0, 10)}…</option>)}
      </select>
      {fns.map((fn) => {
        if (fn.type !== 'function') return null;
        const f = fn as unknown as { name: string; stateMutability: string; inputs: { name: string; type: string }[] };
        return (
          <div key={f.name} className="vs-card">
            <b>{f.name}</b> <span className="opacity-60">({f.stateMutability})</span>
            {f.inputs.map((inp, i) => (
              <input key={i} className="vs-input mt-1" placeholder={`${inp.name || 'arg'}: ${inp.type} (paste address; "my address" allowed)`}
                value={argInputs[`${f.name}:${i}`] ?? ''}
                onChange={(e) => setArgInputs((s) => ({ ...s, [`${f.name}:${i}`]: e.target.value }))} />
            ))}
            <button className="vs-btn-ghost mt-1" onClick={() => void runFn(f.name, f.stateMutability, f.inputs)}>
              {f.stateMutability === 'view' || f.stateMutability === 'pure' ? 'Call' : 'Send (confirm)'}
            </button>
            {results[f.name] && <div className="mt-1 break-all">→ {results[f.name]}</div>}
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab(): JSX.Element {
  const { commands, deployments } = useIde();
  return (
    <div className="text-xs space-y-1">
      <b>Commands</b>
      {commands.map((c) => <div key={c.id}>{c.status === 'ok' ? '✅' : c.status === 'clarify' ? '❓' : '❌'} {c.text} → {c.understood}</div>)}
      <b className="block mt-2">Deployments</b>
      {deployments.map((d) => <div key={d.address} className="vs-card">{d.name} · {d.address} · tx {d.txHash.slice(0, 12)}…</div>)}
      {deployments.length === 0 && <div className="opacity-60">None yet.</div>}
    </div>
  );
}
