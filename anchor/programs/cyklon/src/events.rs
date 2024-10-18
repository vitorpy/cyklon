use anchor_lang::prelude::*;

#[event]
pub struct PoolInitialized {
    pub user: Pubkey,
    pub amount_0: u64,
    pub amount_1: u64,
    pub liquidity: u64,
}

#[event]
pub struct LiquidityAdded {
    pub user: Pubkey,
    pub amount_0: u64,
    pub amount_1: u64,
    pub liquidity: u64,
}

#[event]
pub struct LiquidityRemoved {
    pub user: Pubkey,
    pub amount_0: u64,
    pub amount_1: u64,
    pub liquidity: u64,
}

#[event]
pub struct ConfidentialSwapEvent {
    pub user: Pubkey,
    pub amount_out: u64,
    pub new_sqrt_price: u128,
}
