use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::Pool;

pub fn initialize_pool(
    ctx: Context<InitializePool>,
    tick_spacing: u16,
    initial_sqrt_price: u128,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.token_mint_0 = ctx.accounts.token_mint_0.key();
    pool.token_mint_1 = ctx.accounts.token_mint_1.key();
    pool.tick_spacing = tick_spacing;
    pool.sqrt_price = initial_sqrt_price;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = payer, space = 8 + 32 + 32 + 2 + 16)]
    pub pool: Account<'info, Pool>,
    pub token_mint_0: Account<'info, Mint>,
    pub token_mint_1: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
