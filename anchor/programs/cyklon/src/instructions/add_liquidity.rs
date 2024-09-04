use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, transfer, Transfer};
use crate::state::{Pool, Position};
use crate::errors::ErrorCode;
use crate::events::LiquidityAdded;

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_0: u64,
    amount_1: u64,
    tick_lower: i32,
    tick_upper: i32,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // Ensure ticks are valid
    require!(tick_lower < tick_upper, ErrorCode::InvalidTickRange);
    require!(tick_lower % pool.tick_spacing as i32 == 0, ErrorCode::InvalidLowerTick);
    require!(tick_upper % pool.tick_spacing as i32 == 0, ErrorCode::InvalidUpperTick);

    // Calculate liquidity based on amounts and price range
    let liquidity = calculate_liquidity(amount_0, amount_1, tick_lower, tick_upper, pool.sqrt_price);

    // Update pool liquidity
    pool.liquidity = pool.liquidity.checked_add(liquidity).unwrap();

    // Transfer tokens from user to pool
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account_0.to_account_info(),
                to: ctx.accounts.pool_token_account_0.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_0,
    )?;

    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account_1.to_account_info(),
                to: ctx.accounts.pool_token_account_1.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_1,
    )?;

    // Create or update user position
    let position = &mut ctx.accounts.user_position;
    position.owner = ctx.accounts.user.key();
    position.tick_lower = tick_lower;
    position.tick_upper = tick_upper;
    position.liquidity = position.liquidity.checked_add(liquidity).unwrap();

    emit!(LiquidityAdded {
        user: ctx.accounts.user.key(),
        amount_0,
        amount_1,
        tick_lower,
        tick_upper,
        liquidity,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account_0: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account_1: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_0: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_1: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 4 + 4 + 16,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// Helper function to calculate liquidity (simplified)
fn calculate_liquidity(amount_0: u64, amount_1: u64, tick_lower: i32, tick_upper: i32, current_sqrt_price: u128) -> u128 {
    // This is a simplified calculation and should be replaced with a proper implementation
    let amount_0 = amount_0 as u128;
    let amount_1 = amount_1 as u128;
    let price_lower = 1u128 << (tick_lower as u32);
    let price_upper = 1u128 << (tick_upper as u32);
    
    if current_sqrt_price <= price_lower {
        amount_0
    } else if current_sqrt_price >= price_upper {
        amount_1
    } else {
        (amount_0 * amount_1 / (price_upper - price_lower)).min(amount_0).min(amount_1)
    }
}
