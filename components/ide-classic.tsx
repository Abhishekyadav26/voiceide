'use client';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useIde } from '@/lib/store/ide';
import { FileTree } from '@/components/file-tree';
import { CommandBar } from '@/components/command-bar';
import { RightPanel } from '@/components/right-panel';
import { NetworkBanner } from '@/components/network-banner';
import { DiffModal } from '@/components/diff-modal';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { normalizeSpokenName } from '@/lib/intents/normalize';

const EditorPane = dynamic(() => import('@/components/editor-pane').then((m) => m.EditorPane), { ssr: false });

const STARTER = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Sol Coin — fixed-supply ERC-20
/// @notice Minted once to the deployer.
contract SolCoin is ERC20, Ownable {
    error SupplyAlreadyFixed();

    // 1000000 tokens with 18 decimals
    uint256 public constant FIXED_SUPPLY = 1000000 * 10**18;

    constructor() ERC20("Sol Coin", "SOL") Ownable(msg.sender) {
        _mint(msg.sender, FIXED_SUPPLY);
    }
}
`;

export function IdeClassic(): JSX.Element {
  const { files, activeFile, hydrated, hydrate, setFiles } = useIde();
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (hydrated && files.length === 0) setFiles([{ name: 'SolCoin.sol', content: STARTER }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  return (
    <div className="h-screen flex flex-col">
      <NetworkBanner />
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r overflow-auto" style={{ borderColor: 'var(--vs-border)' }}>
          <FileTree />
        </aside>
        <main className="flex-1 min-w-0 flex flex-col">
          <EditorPane />
        </main>
        <aside className="w-96 shrink-0 border-l overflow-auto" style={{ borderColor: 'var(--vs-border)' }}>
          <RightPanel />
        </aside>
      </div>
      <CommandBar />
      <DiffModal />
    </div>
  );
}
