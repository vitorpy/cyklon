use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use crate::state::Pool;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = payer, space = 8 + Pool::INIT_SPACE, seeds = [b"pool", token_mint_x.key().as_ref(), token_mint_y.key().as_ref()], bump)]
    pub pool: Account<'info, Pool>,
    pub token_mint_x: InterfaceAccount<'info, Mint>,
    pub token_mint_y: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializePool<'info> {
    pub fn initialize_pool(
        &mut self,
        bump: u8,
    ) -> Result<()> {
        if self.token_mint_x.key() >= self.token_mint_y.key() {
            return Err(ErrorCode::InvalidTokenOrder.into());
        }

        let pool = &mut self.pool;
        pool.token_mint_x = self.token_mint_x.key();
        pool.token_mint_y = self.token_mint_y.key();
        pool.bump = bump;
        Ok(())
    }
}