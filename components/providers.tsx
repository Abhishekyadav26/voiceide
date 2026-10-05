'use client';
import { Suspense, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ThemeProvider } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import { baseSepolia } from '@/lib/chain/config';
import { useDesign } from '@/lib/store/design';
import { DesignMenu } from '@/components/design-menu';

const config = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
  ssr: true,
});
const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'demo';

function DesignAttrs({ children }: { children: React.ReactNode }): JSX.Element {
  const { theme, mode, hydrate } = useDesign();
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [theme, mode]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <DesignAttrs>
              {children}
              <Suspense fallback={null}>
                <DesignMenu />
              </Suspense>
            </DesignAttrs>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
