export const APP_CONFIG = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://sepolia.basescan.org',
  solcVersion: process.env.NEXT_PUBLIC_SOLC_VERSION ?? '0.8.24',
  ozVersion: '5.0.2',
  ozCdnBase: 'https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@5.0.2/',
  model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  maxLlmInputChars: Number(process.env.NEXT_PUBLIC_MAX_LLM_INPUT_CHARS ?? 24000),
  faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet',
  maxFixAttempts: 3,
  maxUndoPerFile: 20,
  bytecodeSizeWarnBytes: 24 * 1024,
  optimizerRuns: 200,
} as const;

export const BASE_SEPOLIA = {
  id: 84532,
  name: 'Base Sepolia',
  rpcUrl: APP_CONFIG.rpcUrl,
  explorerUrl: APP_CONFIG.explorerUrl,
} as const;
