use anchor_lang::prelude::*;

#[event]
pub struct LiquidityAdded {
    pub user: Pubkey,
    pub amount_0: u64,
    pub amount_1: u64,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub liquidity: u128,
}

#[event]
pub struct ConfidentialSwapEvent {
    pub user: Pubkey,
    pub amount_out: u64,
    pub new_sqrt_price: u128,
}
