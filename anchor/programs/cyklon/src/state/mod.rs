use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub token_mint_0: Pubkey,
    pub token_mint_1: Pubkey,
    pub tick_spacing: u16,
    pub sqrt_price: u128,
    pub liquidity: u128,
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub liquidity: u128,
}
