'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { APP_CONFIG } from '@/lib/config';

export function NetworkBanner(): JSX.Element {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const wrong = isConnected && chainId !== APP_CONFIG.chainId;
  const zero = isConnected && balance && balance.value === BigInt(0);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 text-xs border-b" style={{ borderColor: 'var(--vs-border)' }}>
      <b>VoiceSol IDE</b>
      <span className="opacity-60">Base Sepolia · solc {APP_CONFIG.solcVersion}</span>
      <span className="flex-1" />
      {wrong && (
        <span className="flex items-center gap-2" role="alert">
          Wrong network (chain {chainId}).
          <button className="vs-btn" onClick={() => switchChain({ chainId: APP_CONFIG.chainId })}>Switch Network</button>
        </span>
      )}
      {zero && !wrong && (
        <a role="alert" className="underline" href={APP_CONFIG.faucetUrl} target="_blank" rel="noreferrer">
          Balance is zero — get Base Sepolia ETH from the faucet
        </a>
      )}
      <ConnectButton showBalance chainStatus="icon" />
    </div>
  );
}
