'use client';

import { AppHero } from '../ui/ui-layout';
import { SolanaSwapComponent } from '../solana-swapper/solana-swap';

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Trade Privately. Now." subtitle="Blackpool is a privacy-preserving trading platform built on Solana." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-9 mt-[50px]">
        <SolanaSwapComponent />
      </div>
    </div>
  );
}
