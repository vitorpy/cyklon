import React, { useState, useEffect } from 'react';
import { TokenSwapper } from '@/components/token-swapper/token-swapper';
import { LiquidityManager } from '@/components/liquidity-manager/liquidity-manager';
import posthog from 'posthog-js';

const TabbedCards: React.FC = () => {
  const [activeTab, setActiveTab] = useState('swap');

  useEffect(() => {
    // Track tab change event
    posthog.capture('tab_changed', { tab: activeTab });
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="tabs tabs-boxed mb-4">
        <a
          className={`tab ${activeTab === 'swap' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('swap')}
        >
          Swap
        </a>
        <a
          className={`tab ${activeTab === 'liquidity' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('liquidity')}
        >
          Liquidity
        </a>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {activeTab === 'swap' && <TokenSwapper />}
          {activeTab === 'liquidity' && (
            <LiquidityManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedCards;
