'use client';
import { useState, useCallback } from 'react';
import { useIde } from '@/lib/store/ide';
import { IntentSchema, type Intent } from '@/lib/intents/schema';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { normalizeSpokenName } from '@/lib/intents/normalize';
import { compileContracts } from '@/lib/compiler/client';
import { APP_CONFIG } from '@/lib/config';

const EXAMPLES = [
  'write an ERC-20 called Sol Coin with a fixed supply of one million',
  'compile',
  'fix the errors',
  'deploy',
  'call balanceOf for my address',
];

async function runCompile(): Promise<void> {
  const s = useIde.getState();
  const fileMap: Record<string, string> = {};
  for (const f of s.files) fileMap[f.name] = f.content;
  s.setCompiling(true, 'Starting…');
  const t0 = Date.now();
  try {
    const result = await compileContracts(fileMap, (m) => useIde.getState().setCompiling(true, m));
    useIde.getState().setCompileResult(result);
    useIde.getState().setCompiling(false);
    useIde.getState().logCommand({
      text: 'compile', heard: 'compile', understood: result.success ? `compiled ${result.contracts.length} contract(s) in ${result.compileTimeMs}ms` : `${result.errors.length} error(s)`,
      status: result.success ? 'ok' : 'error',
    });
  } catch (e) {
    useIde.getState().setCompiling(false);
    useIde.getState().logCommand({ text: 'compile', heard: 'compile', understood: (e as Error).message, status: 'error' });
  }
  void t0;
}

async function assist(mode: 'explain' | 'audit' | 'fix', code: string, errors: string): Promise<string> {
  const res = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, code, errors }) });
  const json = (await res.json()) as { text?: string; error?: string };
  if (json.error) throw new Error(json.error);
  return json.text ?? '';
}

export function CommandBar(): JSX.Element {
  const { files, activeFile, compileResult, deployments, commands, logCommand, setPendingDiff, upsertFile, applyIntent, setExplain, setAudit, fixAttempts, setFixAttempts } = useIde();
  const [text, setText] = useState('');
  const [heard, setHeard] = useState('');
  const [understood, setUnderstood] = useState('');
  const [busy, setBusy] = useState(false);

  const handleIntent = useCallback(async (intent: Intent, rawText: string) => {
    const s = useIde.getState();
    const kind: string = intent.intent;
    const active = s.files.find((f) => f.name === s.activeFile);
    switch (intent.intent) {
      case 'compile': await runCompile(); break;
      case 'write_contract':
      case 'edit_contract': {
        if (intent.code) {
          s.setPendingDiff({ fileName: intent.fileName ?? s.activeFile, before: active?.content ?? '', after: intent.code, label: intent.intent });
          setUnderstood(`parsed as ${intent.intent} → diff ready for review (Esc to cancel)`);
        } else if (intent.template) {
          const t = TEMPLATES[intent.template as TemplateId];
          const nm = intent.contractName ?? 'MyToken';
          const { contractName, tokenName } = /^[A-Z]/.test(nm) ? { contractName: nm, tokenName: nm } : normalizeSpokenName(nm);
          const code = t.code(contractName, tokenName);
          s.setPendingDiff({ fileName: intent.fileName ?? t.fileName, before: s.files.find((f) => f.name === t.fileName)?.content ?? '', after: code, label: `template:${intent.template}` });
          setUnderstood(`parsed as ${intent.intent} (${intent.template}) → diff ready`);
        } else {
          setUnderstood('parsed as write_contract but no code returned — clarify');
        }
        break;
      }
      case 'set_template': {
        const t = intent.template ? TEMPLATES[intent.template as TemplateId] : undefined;
        if (t) {
          s.setPendingDiff({ fileName: t.fileName, before: s.files.find((f) => f.name === t.fileName)?.content ?? '', after: t.code('MyToken', 'My Token'), label: `template:${intent.template}` });
          setUnderstood(`parsed as set_template (${intent.template}) → diff ready`);
        }
        break;
      }
      case 'fix_errors': {
        if (s.fixAttempts >= APP_CONFIG.maxFixAttempts) {
          setUnderstood(`stopped after ${APP_CONFIG.maxFixAttempts} attempts — still failing. Review errors in Compiler tab.`);
          logCommand({ text: rawText, heard: rawText, understood: 'fix budget exhausted', status: 'error' });
          break;
        }
        const errs = [...(s.compileResult?.errors ?? [])].map((e) => `${e.file}:${e.line}:${e.column} ${e.message}`).join('\n');
        if (!errs) { setUnderstood('no errors to fix — compile is clean'); break; }
        try {
          const fixed = await assist('fix', active?.content ?? '', errs);
          s.setFixAttempts(s.fixAttempts + 1);
          s.setPendingDiff({ fileName: s.activeFile, before: active?.content ?? '', after: fixed, label: 'fix_errors' });
          setUnderstood(`parsed as fix_errors (attempt ${s.fixAttempts + 1}) → diff ready, recompile after Accept`);
        } catch (e) { setUnderstood(`fix failed: ${(e as Error).message}`); }
        break;
      }
      case 'explain': {
        try {
          const t = await assist('explain', active?.content ?? '', '');
          s.setExplain(t);
          setUnderstood('parsed as explain → see Compiler tab / read aloud available');
          void speak(t);
        } catch (e) { setUnderstood(`explain failed: ${(e as Error).message}`); }
        break;
      }
      case 'audit': {
        try {
          const t = await assist('audit', active?.content ?? '', '');
          s.setAudit(t);
          setUnderstood('parsed as audit → AI review in Compiler tab (not a security audit)');
        } catch (e) { setUnderstood(`audit failed: ${(e as Error).message}`); }
        break;
      }
      case 'deploy':
        setUnderstood('parsed as deploy → complete the Deploy tab form and confirm in wallet');
        document.querySelector('[data-tab="deploy"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        break;
      case 'verify':
        setUnderstood('parsed as verify → use the Deploy tab Verify button after deploying');
        break;
      case 'call_function':
        setUnderstood(`parsed as call_function ${intent.functionName ?? ''}(${(intent.functionArgs ?? []).join(', ')}) → confirm in Interact tab`);
        break;
      case 'set_constructor_args':
        setUnderstood('parsed as set_constructor_args → fill the Deploy tab constructor form');
        break;
      case 'undo': s.applyIntent(intent); setUnderstood('parsed as undo → reverted one step'); break;
      case 'navigate_step':
        setUnderstood(`parsed as navigate_step (${intent.direction})`);
        window.dispatchEvent(new CustomEvent('vs-step', { detail: intent.direction }));
        break;
      case 'clarify':
        setUnderstood(`clarify: ${intent.question ?? 'could you rephrase?'}`);
        logCommand({ text: rawText, heard: rawText, understood: intent.question ?? 'clarify', status: 'clarify' });
        return;
    }
    if (kind !== 'clarify') logCommand({ text: rawText, heard: rawText, understood: `intent=${kind}`, status: 'ok' });
  }, [logCommand]);

  const run = useCallback(async () => {
    const raw = text.trim();
    if (!raw || busy) return;
    setBusy(true);
    setHeard(raw);
    setUnderstood('parsing…');
    try {
      const s = useIde.getState();
      const active = s.files.find((f) => f.name === s.activeFile);
      const res = await fetch('/api/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: raw, activeFile: s.activeFile, fileList: s.files.map((f) => f.name),
          activeCode: active?.content ?? '', compilerOutput: JSON.stringify(s.compileResult?.errors ?? []).slice(0, 4000),
          deployments: s.deployments.map((d) => ({ name: d.name, address: d.address })),
        }),
      });
      const json = (await res.json()) as unknown;
      const v = IntentSchema.safeParse(json);
      if (!v.success) {
        setUnderstood('clarify: could you rephrase that?');
        logCommand({ text: raw, heard: raw, understood: 'invalid intent', status: 'clarify' });
      } else {
        const label = v.data.intent === 'clarify' ? `clarify: ${v.data.question}` : `understood as ${v.data.intent}`;
        setUnderstood(label);
        await handleIntent(v.data, raw);
      }
    } catch (e) {
      setUnderstood(`error: ${(e as Error).message}`);
      logCommand({ text: raw, heard: raw, understood: (e as Error).message, status: 'error' });
    } finally {
      setBusy(false);
      setText('');
    }
  }, [text, busy, handleIntent, logCommand]);

  return (
    <div className="border-t p-3" style={{ borderColor: 'var(--vs-border)' }}>
      {commands.length === 0 && (
        <div className="text-xs opacity-70 mb-2">
          Try: {EXAMPLES.map((e, i) => <span key={e}>{i > 0 && ' · '}“{e}”</span>)}
        </div>
      )}
      <div className="flex gap-2">
        <input
          autoFocus className="vs-input" placeholder='Dictate via Wispr Flow, then press Ctrl+Enter — e.g. "write an ERC-20 called Sol Coin…"'
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void useIde.getState().persist(); }
          }}
          aria-label="Voice command bar" disabled={busy}
        />
        <button className="vs-btn" onClick={run} disabled={busy || !text.trim()}>{busy ? '…' : 'Run'}</button>
      </div>
      <div className="text-xs mt-1 opacity-80" aria-live="polite">
        <div>heard: {heard || '—'}</div>
        <div>understood as: {understood || '—'}</div>
      </div>
      <div className="max-h-20 overflow-auto mt-1 text-xs space-y-0.5" aria-label="Command history">
        {commands.slice(-8).reverse().map((c) => (
          <div key={c.id} className="flex gap-2">
            <span>{c.status === 'ok' ? '✅' : c.status === 'clarify' ? '❓' : c.status === 'pending' ? '⏳' : '❌'}</span>
            <span className="truncate">“{c.text}” → {c.understood}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function speak(t: string): void {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(t.slice(0, 1000)));
    }
  } catch { /* no speech */ }
}
export { runCompile };
