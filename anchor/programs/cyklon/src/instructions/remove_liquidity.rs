use anchor_lang::prelude::*;
use anchor_spl::token::{Mint as SplMint, Token as SplToken, Burn as SplBurn, burn as spl_burn};
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;

use crate::errors::ErrorCode;
use crate::state::Pool;
use crate::events::LiquidityRemoved;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    pub token_mint_x: Box<InterfaceAccount<'info, Mint>>,
    pub token_mint_y: Box<InterfaceAccount<'info, Mint>>,
    pub token_mint_x_program: Interface<'info, TokenInterface>,
    pub token_mint_y_program: Interface<'info, TokenInterface>,
    #[account(
        mut,
        seeds = [b"lp", token_mint_x.key().as_ref(), token_mint_y.key().as_ref()],
        bump
    )]
    pub token_mint_lp: Account<'info, SplMint>,
    pub token_mint_lp_program: Program<'info, SplToken>,
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
    pub user_token_account_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        associated_token::mint = token_mint_y,
        associated_token::authority = user,
        associated_token::token_program = token_mint_y_program.key(),
    )]
    pub user_token_account_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        associated_token::mint = token_mint_lp,
        associated_token::authority = user,
        associated_token::token_program = token_mint_lp_program,
        payer = user
    )]
    pub user_token_account_lp: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        associated_token::mint = token_mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_mint_x_program.key(),
    )]
    pub pool_token_account_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        associated_token::mint = token_mint_y,
        associated_token::authority = pool,
        associated_token::token_program = token_mint_y_program.key(),
    )]
    pub pool_token_account_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> RemoveLiquidity<'info> {
    pub fn remove_liquidity(&mut self, amount: u64) -> Result<()> {
        msg!("Removing liquidity: {}", amount);
        msg!("Reserve X: {}", self.pool.reserve_x);
        msg!("Reserve Y: {}", self.pool.reserve_y);
        msg!("Liquidity: {}", self.pool.liquidity);

        let amount_x = (amount as u128)
            .checked_mul(self.pool.reserve_x as u128)
            .and_then(|product| product.checked_div(self.pool.liquidity as u128))
            .and_then(|result| u64::try_from(result).ok())
            .ok_or(ErrorCode::MathOverflow)?;

        let amount_y = (amount as u128)
            .checked_mul(self.pool.reserve_y as u128)
            .and_then(|product| product.checked_div(self.pool.liquidity as u128))
            .and_then(|result| u64::try_from(result).ok())
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Amount X: {}", amount_x);
        msg!("Amount Y: {}", amount_y);

        spl_burn(
            CpiContext::new(
                self.token_mint_lp_program.to_account_info(),
                SplBurn {
                    from: self.user_token_account_lp.to_account_info(),
                    authority: self.user.to_account_info(),
                    mint: self.token_mint_lp.to_account_info(),
                },
            ),
            amount,
        )?;

        let token_mint_x_key = self.token_mint_x.key();
        let token_mint_y_key = self.token_mint_y.key();

        let pool_signer_seeds = &[
            b"pool",
            token_mint_x_key.as_ref(),
            token_mint_y_key.as_ref(),
            &[self.pool.bump],
        ];

        transfer_checked(
            CpiContext::new_with_signer(
                self.token_mint_x_program.to_account_info(),
                TransferChecked {
                    from: self.pool_token_account_x.to_account_info(),
                    to: self.user_token_account_x.to_account_info(),
                    authority: self.pool.to_account_info(),
                    mint: self.token_mint_x.to_account_info(),
                },
                &[&pool_signer_seeds[..]],
            ),
            amount_x,
            self.token_mint_x.decimals,
        )?;
        self.pool.reserve_x = self.pool.reserve_x.checked_sub(amount_x).unwrap();

        transfer_checked(
            CpiContext::new_with_signer(
                self.token_mint_y_program.to_account_info(),
                TransferChecked {
                    from: self.pool_token_account_y.to_account_info(),
                    to: self.user_token_account_y.to_account_info(),
                    authority: self.pool.to_account_info(),
                    mint: self.token_mint_y.to_account_info(),
                },
                &[&pool_signer_seeds[..]],
            ),
            amount_y,
            self.token_mint_y.decimals,
        )?;
        self.pool.reserve_y = self.pool.reserve_y.checked_sub(amount_y).unwrap();

        self.pool.liquidity = self.pool.liquidity.checked_sub(amount.into()).unwrap();

        emit!(LiquidityRemoved {
            user: self.user.key(),
            amount_x,
            amount_y,
            liquidity: amount,
        });

        Ok(())
    }
}
