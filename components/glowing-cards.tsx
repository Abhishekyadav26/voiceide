"use client";

import { Mic, FileDiff, Hammer, Rocket, BadgeCheck, LayoutGrid } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const CARDS = [
  {
    icon: <Mic className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Speak",
    description: "Dictate via Wispr Flow — “write a hello contract”, “compile”, “deploy”.",
  },
  {
    icon: <FileDiff className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Review",
    description: "Every change arrives as a diff. Accept what you want, reject the rest.",
  },
  {
    icon: <Hammer className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Compile",
    description: "solc 0.8.24 runs in a Web Worker with OpenZeppelin imports resolved.",
  },
  {
    icon: <Rocket className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Deploy",
    description: "Your wallet signs on Base Sepolia. No keys ever touch the app.",
  },
  {
    icon: <BadgeCheck className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Verify",
    description: "Submit standard JSON to Basescan and poll until it reads “Verified”.",
  },
  {
    icon: <LayoutGrid className="h-4 w-4 text-black dark:text-neutral-400" />,
    title: "Templates",
    description: "ERC-20, ERC-721, ERC-1155, Vault, Multisig, Crowdfunding — ready to dictate.",
  },
];

interface GridItemProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ icon, title, description }: GridItemProps) => {
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 font-sans text-xl font-semibold leading-[1.375rem] tracking-tight text-balance text-black md:text-2xl md:leading-[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm leading-[1.125rem] text-black md:text-base md:leading-[1.375rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export function GlowingCards(): JSX.Element {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {CARDS.map((c) => (
        <GridItem key={c.title} icon={c.icon} title={c.title} description={c.description} />
      ))}
    </ul>
  );
}
