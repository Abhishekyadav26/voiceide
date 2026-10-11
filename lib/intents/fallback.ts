import { normalizeSpokenName } from './normalize';

/** Pull a contract name out of dictation: "called Sol Coin" -> SolCoin, "hello …" -> Hello. */
export function extractContractName(lower: string): string | undefined {
  const called = lower.match(/(?:called|named)\s+([a-z0-9][a-z0-9\s]{0,40})/);
  if (called?.[1]) {
    const words = called[1].trim().split(/\s+/).slice(0, 3).join(' ');
    if (words) return normalizeSpokenName(words).contractName;
  }
  if (/\bhello\b|\bhi\b|\bgreet/.test(lower)) return 'Hello';
  return undefined;
}

/**
 * Local parser used when GROQ_API_KEY is unset or the AI call fails.
 * Always returns a plain object that IntentSchema accepts.
 */
export function fallbackParse(text: string): unknown {
  const t = text.toLowerCase();
  if (/compile|build it/.test(t)) return { intent: 'compile' };
  if (/fix.*error|fix it/.test(t)) return { intent: 'fix_errors' };
  if (/explain|what does/.test(t)) return { intent: 'explain' };
  if (/audit|vulnerab|security/.test(t)) return { intent: 'audit' };
  if (/deploy/.test(t)) return { intent: 'deploy' };
  if (/verify|verif/.test(t)) return { intent: 'verify' };
  if (/undo|revert/.test(t)) return { intent: 'undo' };
  if (/next step/.test(t)) return { intent: 'navigate_step', direction: 'next' };
  if (/go back|previous step/.test(t)) return { intent: 'navigate_step', direction: 'back' };
  if (/call\s+(\w+)/.test(t)) {
    const m = t.match(/call\s+(\w+)/);
    return { intent: 'call_function', functionName: m?.[1], functionArgs: [] };
  }
  if (/erc-?20|erc-?721|erc-?1155|vault|multisig|crowdfund/.test(t)) {
    const template = /721/.test(t) ? 'erc721' : /1155/.test(t) ? 'erc1155' : /vault/.test(t) ? 'vault' : /multisig/.test(t) ? 'multisig' : /crowdfund/.test(t) ? 'crowdfunding' : 'erc20';
    return { intent: 'set_template', template };
  }
  if (/write|create/.test(t)) {
    return { intent: 'write_contract', description: text.slice(0, 500), contractName: extractContractName(t) ?? 'MyContract' };
  }
  return { intent: 'clarify', question: 'What should I do — write, compile, deploy, or call a function?' };
}
