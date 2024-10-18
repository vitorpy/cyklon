use anchor_lang::prelude::*;
use anchor_spl::token::{Mint as SplMint, Token as SplToken, Burn as SplBurn, burn as spl_burn};
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;

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
    pub fn remove_liquidity(&self, amount: u64) -> Result<()> {
        let amount_x = amount * self.pool.reserve_x / (self.pool.liquidity as u64);
        let amount_y = amount * self.pool.reserve_y / (self.pool.liquidity as u64);

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
            amount_x,
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
            amount_y,
            self.token_mint_y.decimals,
        )?;
        
        emit!(LiquidityRemoved {
            user: self.user.key(),
            amount_0: amount_x,
            amount_1: amount_y,
            liquidity: amount,
        });

        Ok(())
    }
}
