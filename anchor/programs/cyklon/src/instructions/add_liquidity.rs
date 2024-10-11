use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::state::Pool;
use crate::errors::ErrorCode;
use crate::events::LiquidityAdded;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account_0: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account_1: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_0: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_1: InterfaceAccount<'info, TokenAccount>,
    pub token_mint_0: InterfaceAccount<'info, Mint>,
    pub token_mint_1: InterfaceAccount<'info, Mint>,
    pub user: Signer<'info>,
    pub token_mint_0_program: Interface<'info, TokenInterface>,
    pub token_mint_1_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddLiquidity<'info> {
    pub fn add_liquidity(
        &mut self,
        amount_0: u64,
        amount_1: u64,
    ) -> Result<()> {
        // Add this check at the beginning of the function
        if self.token_mint_0.key() >= self.token_mint_1.key() {
            return Err(ErrorCode::InvalidTokenOrder.into());
        }

        let pool = &mut self.pool;
        
        // Calculate the liquidity to be added
        let liquidity = if pool.reserve_0 == 0 && pool.reserve_1 == 0 {
            (amount_0 as u128 * amount_1 as u128) as u64
        } else {
            let liquidity_0 = amount_0 * pool.reserve_1 / pool.reserve_0;
            let liquidity_1 = amount_1 * pool.reserve_0 / pool.reserve_1;
            liquidity_0.min(liquidity_1)
        };

        // Update pool reserves
        pool.reserve_0 = pool.reserve_0.checked_add(amount_0).unwrap();
        pool.reserve_1 = pool.reserve_1.checked_add(amount_1).unwrap();

        // Transfer tokens from user to pool
        transfer_checked(
            CpiContext::new(
                self.token_mint_0_program.to_account_info(),
                TransferChecked {
                    from: self.user_token_account_0.to_account_info(),
                    to: self.pool_token_account_0.to_account_info(),
                    authority: self.user.to_account_info(),
                    mint: self.token_mint_0.to_account_info(),
                },
            ),
            amount_0,
            self.token_mint_0.decimals,
        )?;

        transfer_checked(
            CpiContext::new(
                self.token_mint_1_program.to_account_info(),
                TransferChecked {
                    from: self.user_token_account_1.to_account_info(),
                    to: self.pool_token_account_1.to_account_info(),
                    authority: self.user.to_account_info(),
                    mint: self.token_mint_1.to_account_info(),
                },
            ),
            amount_1,
            self.token_mint_1.decimals,
        )?;

        emit!(LiquidityAdded {
            user: self.user.key(),
            amount_0,
            amount_1,
            liquidity,
        });

        Ok(())
    }
}
