use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;

use crate::state::Pool;
use crate::errors::ErrorCode;
use crate::events::LiquidityAdded;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    pub token_mint_x: InterfaceAccount<'info, Mint>,
    pub token_mint_y: InterfaceAccount<'info, Mint>,
    pub token_mint_x_program: Interface<'info, TokenInterface>,
    pub token_mint_y_program: Interface<'info, TokenInterface>,
    #[account(mut,
        seeds = [b"pool", pool.token_mint_x.key().as_ref(), pool.token_mint_y.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut,
        associated_token::mint = token_mint_x,
        associated_token::authority = user,
        associated_token::token_program = token_mint_x_program.key(),
    )]
    pub user_token_account_x: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_y,
        associated_token::authority = user,
        associated_token::token_program = token_mint_y_program.key(),
    )]
    pub user_token_account_y: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_mint_x_program.key(),
    )]
    pub pool_token_account_x: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_y,
        associated_token::authority = pool,
        associated_token::token_program = token_mint_y_program.key(),
    )]
    pub pool_token_account_y: InterfaceAccount<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddLiquidity<'info> {
    pub fn add_liquidity(
        &mut self,
        amount_0: u64,
        amount_1: u64,
    ) -> Result<()> {
        // Add this check at the beginning of the function
        if self.token_mint_x.key() >= self.token_mint_y.key() {
            return Err(ErrorCode::InvalidTokenOrder.into());
        }

        let pool = &mut self.pool;
        
        // Calculate the liquidity to be added
        let liquidity = if pool.reserve_x == 0 && pool.reserve_y == 0 {
            (amount_0 as u128 * amount_1 as u128) as u64
        } else {
            let liquidity_x = amount_0 * pool.reserve_y / pool.reserve_x;
            let liquidity_y = amount_1 * pool.reserve_x / pool.reserve_y;
            liquidity_x.min(liquidity_y)
        };

        // Update pool reserves
        pool.reserve_x = pool.reserve_x.checked_add(amount_0).unwrap();
        pool.reserve_y = pool.reserve_y.checked_add(amount_1).unwrap();

        // Transfer tokens from user to pool
        transfer_checked(
            CpiContext::new(
                self.token_mint_x_program.to_account_info(),
                TransferChecked {
                    from: self.user_token_account_x.to_account_info(),
                    to: self.pool_token_account_x.to_account_info(),
                    authority: self.user.to_account_info(),
                    mint: self.token_mint_x.to_account_info(),
                },
            ),
            amount_0,
            self.token_mint_x.decimals,
        )?;

        transfer_checked(
            CpiContext::new(
                self.token_mint_y_program.to_account_info(),
                TransferChecked {
                    from: self.user_token_account_y.to_account_info(),
                    to: self.pool_token_account_y.to_account_info(),
                    authority: self.user.to_account_info(),
                    mint: self.token_mint_y.to_account_info(),
                },
            ),
            amount_1,
            self.token_mint_y.decimals,
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
