const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};
const MAGNITUDE: Record<string, number> = {
  hundred: 100, thousand: 1_000, million: 1_000_000, billion: 1_000_000_000, trillion: 1_000_000_000_000,
};

/** "one million" -> 1000000; "two million five hundred thousand" -> 2500000; "no, make that two million" -> 2000000 */
export function parseSpokenNumber(text: string): number | null {
  let t = text.toLowerCase().trim();
  // self-correction: take text after last "make that" / "i mean" / "actually"
  const corr = t.split(/(?:make that|i mean|actually|rather|instead)\b/).pop() ?? t;
  t = corr.replace(/[,]/g, ' ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
  // plain digits with optional magnitude: "2 million", "1,000,000"
  const digitMag = t.match(/(\d+(?:\.\d+)?)\s*(hundred|thousand|million|billion|trillion)?s?\b/);
  const tokens = t.split(' ').filter(Boolean);
  const hasNumberWord = tokens.some((w) => w in NUMBER_WORDS || w in MAGNITUDE);
  if (!hasNumberWord) {
    if (digitMag) {
      const base = parseFloat(digitMag[1] ?? '0');
      const mag = digitMag[2] ? (MAGNITUDE[digitMag[2]] ?? 1) : 1;
      return Math.round(base * mag);
    }
    return null;
  }
  let total = 0;
  let current = 0;
  for (const w of tokens) {
    const clean = w.replace(/s$/, '');
    const word = (NUMBER_WORDS[clean] !== undefined ? clean : w);
    const magWord = (MAGNITUDE[clean] !== undefined ? clean : (MAGNITUDE[w] !== undefined ? w : null));
    if (word in NUMBER_WORDS) {
      current += NUMBER_WORDS[word] as number;
    } else if (magWord) {
      const m = MAGNITUDE[magWord] as number;
      if (m === 100) current = (current || 1) * m;
      else { current = (current || 1) * m; total += current; current = 0; }
    } else if (/^\d+(\.\d+)?$/.test(w)) {
      current += parseFloat(w);
    }
  }
  total += current;
  return total === 0 && !tokens.includes('zero') ? null : total;
}

/** Apply ERC-20 decimals: 1000000 with 18 decimals -> "1000000 * 10**18" + comment */
export function tokenSupplyWithDecimals(amount: number, decimals = 18): { expr: string; comment: string } {
  return {
    expr: `${amount} * 10**${decimals}`,
    comment: `// ${amount.toLocaleString('en-US')} tokens with ${decimals} decimals`,
  };
}

function titleCase(words: string): string {
  return words.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** "sol coin" -> { contractName: "SolCoin", tokenName: "Sol Coin" } */
export function normalizeSpokenName(spoken: string): { contractName: string; tokenName: string } {
  const cleaned = spoken.trim().replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokenName = titleCase(cleaned);
  const contractName = tokenName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const safe = /^[A-Za-z][A-Za-z0-9]*$/.test(contractName) ? contractName : `Token${contractName}`;
  return { contractName: safe, tokenName };
}

/** Remove filler words and resolve self-corrections for display/parsing. */
export function cleanDictation(text: string): string {
  let t = ` ${text.toLowerCase()} `;
  const fillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'please', 'can you', 'could you', 'would you'];
  for (const f of fillers) t = t.replace(new RegExp(`\\b${f}\\b`, 'g'), ' ');
  // self-correction: keep the part after the last correction marker
  const parts = t.split(/\b(no\s*,?\s*(make that|change (it )?to)|i mean|actually|rather|instead|sorry)\b/);
  t = parts[parts.length - 1] ?? t;
  return t.replace(/\s+/g, ' ').trim();
}
