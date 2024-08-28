use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod clmm_dex {
    use super::*;

    // ... (previous functions remain the same)

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
        zero_for_one: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // Calculate the swap result
        let (amount_out, new_sqrt_price) = calculate_swap(
            amount_in,
            pool.liquidity,
            pool.sqrt_price,
            zero_for_one,
        );

        // Ensure the swap meets the minimum amount out
        require!(amount_out >= minimum_amount_out, ErrorCode::SlippageExceeded);

        // Update pool state
        pool.sqrt_price = new_sqrt_price;

        // Transfer tokens
        if zero_for_one {
            // Transfer token 0 from user to pool
            transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_account_in.to_account_info(),
                        to: ctx.accounts.pool_token_account_0.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer token 1 from pool to user
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_account_1.to_account_info(),
                        to: ctx.accounts.user_token_account_out.to_account_info(),
                        authority: ctx.accounts.pool.to_account_info(),
                    },
                    &[&[b"pool", &[ctx.bumps.pool]]],
                ),
                amount_out,
            )?;
        } else {
            // Transfer token 1 from user to pool
            transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_account_in.to_account_info(),
                        to: ctx.accounts.pool_token_account_1.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer token 0 from pool to user
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_account_0.to_account_info(),
                        to: ctx.accounts.user_token_account_out.to_account_info(),
                        authority: ctx.accounts.pool.to_account_info(),
                    },
                    &[&[b"pool", &[ctx.bumps.pool]]],
                ),
                amount_out,
            )?;
        }

        emit!(SwapEvent {
            user: ctx.accounts.user.key(),
            amount_in,
            amount_out,
            zero_for_one,
            new_sqrt_price,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account_in: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account_out: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_0: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_1: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub token_mint_0: Pubkey,
    pub token_mint_1: Pubkey,
    pub tick_spacing: u16,
    pub sqrt_price: u128,
    pub liquidity: u128,
}

#[event]
pub struct SwapEvent {
    pub user: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub zero_for_one: bool,
    pub new_sqrt_price: u128,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    // ... (other error codes)
}

// Helper function to calculate swap result (simplified)
fn calculate_swap(
    amount_in: u64,
    liquidity: u128,
    sqrt_price: u128,
    zero_for_one: bool,
) -> (u64, u128) {
    // This is a placeholder. In a real implementation, you'd use a more complex formula
    // that accurately calculates the swap based on the concentrated liquidity model.
    let amount_out = if zero_for_one {
        (amount_in as u128 * liquidity / sqrt_price) as u64
    } else {
        (amount_in as u128 * sqrt_price / liquidity) as u64
    };

    let new_sqrt_price = if zero_for_one {
        sqrt_price - (amount_in as u128 * 1_000_000 / liquidity)
    } else {
        sqrt_price + (amount_in as u128 * 1_000_000 / liquidity)
    };

    (amount_out, new_sqrt_price)
}
