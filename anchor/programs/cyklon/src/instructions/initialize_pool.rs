use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use crate::state::Pool;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = payer, space = 8 + 32 + 32 + 2 + 16, seeds = [b"pool"], bump)]
    pub pool: Account<'info, Pool>,
    pub token_mint_0: InterfaceAccount<'info, Mint>,
    pub token_mint_1: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializePool<'info> {
    pub fn initialize_pool(
        &mut self,
        tick_spacing: u16,
    initial_sqrt_price: u128,
) -> Result<()> {
        let pool = &mut self.pool;
        pool.token_mint_0 = self.token_mint_0.key();
        pool.token_mint_1 = self.token_mint_1.key();
        pool.tick_spacing = tick_spacing;
        pool.sqrt_price = initial_sqrt_price;
        Ok(())
    }
}