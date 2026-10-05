import { defineChain } from 'viem';
import { APP_CONFIG } from '../config';

export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [APP_CONFIG.rpcUrl] } },
  blockExplorers: { default: { name: 'Basescan', url: APP_CONFIG.explorerUrl } },
  testnet: true,
});

export function txUrl(hash: string): string {
  return `${APP_CONFIG.explorerUrl}/tx/${hash}`;
}
export function addressUrl(address: string): string {
  return `${APP_CONFIG.explorerUrl}/address/${address}`;
}
