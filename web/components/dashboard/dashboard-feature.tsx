'use client';

import { AppHero } from '../ui/ui-layout';
import { SolanaSwapComponent } from '../solana-swapper/solana-swap';

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Blackpool Swap" subtitle="Trade privately." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-9">
        <SolanaSwapComponent />
      </div>
    </div>
  );
}
