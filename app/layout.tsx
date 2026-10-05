import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'VoiceSol IDE — Speak Solidity, Ship on Base Sepolia',
  description: 'Browser-based Solidity IDE driven by voice dictation. Write, compile, deploy, verify on Base Sepolia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
