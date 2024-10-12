use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct Pool {
    pub token_mint_x: Pubkey,
    pub token_mint_y: Pubkey,
    pub reserve_x: u64,
    pub reserve_y: u64,
    pub liquidity: u128,
    pub bump: u8,
}
