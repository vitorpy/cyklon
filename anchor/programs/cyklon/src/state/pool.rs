use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct Pool {
    pub token_mint_0: Pubkey,
    pub token_mint_1: Pubkey,
    pub reserve_0: u64,
    pub reserve_1: u64,
    pub liquidity: u128,
}
