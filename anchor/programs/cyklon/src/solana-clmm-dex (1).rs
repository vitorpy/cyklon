use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod clmm_dex {
    use super::*;

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
        pool.liquidity = 0;
        Ok(())
    }

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

    // ... (other functions like swap remain the same)
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

#[event]
pub struct LiquidityAdded {
    pub user: Pubkey,
    pub amount_0: u64,
    pub amount_1: u64,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub liquidity: u128,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Lower tick must be less than upper tick")]
    InvalidTickRange,
    #[msg("Lower tick must be a multiple of tick spacing")]
    InvalidLowerTick,
    #[msg("Upper tick must be a multiple of tick spacing")]
    InvalidUpperTick,
}

// Helper function to calculate liquidity (simplified)
fn calculate_liquidity(amount_0: u64, amount_1: u64, tick_lower: i32, tick_upper: i32, current_sqrt_price: u128) -> u128 {
    // This is a placeholder. In a real implementation, you'd use a more complex formula
    // that takes into account the current price and the price range.
    ((amount_0 as u128) * (amount_1 as u128)).sqrt()
}
