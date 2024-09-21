'use client';

import { AppHero } from '../ui/ui-layout';
import { SolanaSwapComponent } from '../solana-swapper/solana-swap';

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Secure. Private. Efficient." subtitle="Blackpool: Advanced privacy-preserving trading platform powered by Solana technology." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-9 mt-[50px]">
        <SolanaSwapComponent />
      </div>
    </div>
  );
}
