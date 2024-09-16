use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Pool, Position};
use crate::errors::ErrorCode;
use crate::events::LiquidityAdded;


#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut,
        seeds = [b"pool", pool.token_mint_0.key().as_ref(), pool.token_mint_1.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut,
        associated_token::mint = token_mint_0,
        associated_token::authority = user
    )]
    pub user_token_account_0: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_1,
        associated_token::authority = user
    )]
    pub user_token_account_1: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_0,
        associated_token::authority = pool
    )]
    pub pool_token_account_0: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
        associated_token::mint = token_mint_1,
        associated_token::authority = pool
    )]
    pub pool_token_account_1: InterfaceAccount<'info, TokenAccount>,
    pub token_mint_0: Box<InterfaceAccount<'info, Mint>>,
    pub token_mint_1: Box<InterfaceAccount<'info, Mint>>,
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
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> AddLiquidity<'info> {
    pub fn add_liquidity(
        &mut self,
        amount_0: u64,
        amount_1: u64,
        tick_lower: i32,
        tick_upper: i32,
    ) -> Result<()> {
        let pool = &mut self.pool;
        
        // Ensure ticks are valid
        require!(tick_lower < tick_upper, ErrorCode::InvalidTickRange);
        require!(tick_lower % pool.tick_spacing as i32 == 0, ErrorCode::InvalidLowerTick);
        require!(tick_upper % pool.tick_spacing as i32 == 0, ErrorCode::InvalidUpperTick);

        // Calculate liquidity based on amounts and price range
        let liquidity = calculate_liquidity(amount_0, amount_1, tick_lower, tick_upper, pool.sqrt_price)?;

        // Update pool liquidity
        pool.liquidity = pool.liquidity.checked_add(liquidity).unwrap();

        // Transfer tokens from user to pool
        transfer_checked(
            CpiContext::new(
                self.token_program.to_account_info(),
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
                self.token_program.to_account_info(),
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

        // Create or update user position
        let position = &mut self.user_position;
        position.owner = self.user.key();
        position.tick_lower = tick_lower;
        position.tick_upper = tick_upper;
        position.liquidity = position.liquidity.checked_add(liquidity).unwrap();

        emit!(LiquidityAdded {
            user: self.user.key(),
            amount_0,
            amount_1,
            tick_lower,
            tick_upper,
            liquidity,
        });

        Ok(())
    }
}


// Helper function to calculate liquidity (simplified)
fn calculate_liquidity(amount_0: u64, amount_1: u64, tick_lower: i32, tick_upper: i32, current_sqrt_price: u128) -> Result<u128> {
    // This is a simplified calculation and should be replaced with a proper implementation
    let amount_0 = u128::from(amount_0);
    let amount_1 = u128::from(amount_1);
    let price_lower = 1u128.checked_shl(u32::try_from(tick_lower).unwrap_or(0)).ok_or(ErrorCode::MathOverflow)?;
    let price_upper = 1u128.checked_shl(u32::try_from(tick_upper).unwrap_or(0)).ok_or(ErrorCode::MathOverflow)?;
    
    if current_sqrt_price <= price_lower {
        Ok(amount_0)
    } else if current_sqrt_price >= price_upper {
        Ok(amount_1)
    } else {
        let price_diff = price_upper.checked_sub(price_lower).ok_or(ErrorCode::MathOverflow)?;
        let product = amount_0.checked_mul(amount_1).ok_or(ErrorCode::MathOverflow)?;
        let division_result = product.checked_div(price_diff).ok_or(ErrorCode::MathOverflow)?;
        Ok(division_result.min(amount_0).min(amount_1))
    }
}
