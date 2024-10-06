use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked};
use groth16_solana::{self, groth16::Groth16Verifier};

use crate::state::Pool;
use crate::errors::ErrorCode;
use crate::constants::VERIFYINGKEY;

#[derive(Accounts)]
pub struct ConfidentialSwap<'info> {
    #[account(mut,
        seeds = [b"pool", pool.token_mint_0.key().as_ref(), pool.token_mint_1.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account_in: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account_out: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_0: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account_1: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub token_mint_0: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub token_mint_1: InterfaceAccount<'info, Mint>,
    pub user: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> ConfidentialSwap<'info> {
    pub fn confidential_swap(
        &mut self,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_inputs: [[u8; 32]; 3],
    ) -> Result<()> {
        msg!("Confidential swap started");

        // Create a new Groth16Verifier instance
        let mut verifier_result = Groth16Verifier::new(
            &proof_a,
            &proof_b,
            &proof_c,
            &public_inputs,
            &VERIFYINGKEY,
        ).map_err(|_| ErrorCode::InvalidGroth16Verifier)?;

        // Verify the proof
        let verified = verifier_result.verify().map_err(|_| ErrorCode::InvalidProof)?;

        if verified {
            let pool = &mut self.pool;
            
            // Extract values from public inputs
            // We'll use only the last 8 bytes of each 32-byte input for u64 conversion
            let new_balance_x = u64::from_be_bytes(public_inputs[0][24..].try_into().unwrap());
            let new_balance_y = u64::from_be_bytes(public_inputs[1][24..].try_into().unwrap());
            
            // Determine swap direction and calculate amount_in and amount_out
            let (from_user_account, to_pool_account, from_pool_account, to_user_account, from_mint, to_mint, amount_in, amount_out) = if new_balance_x > pool.reserve_0 {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_0,
                    &self.pool_token_account_1,
                    &self.user_token_account_out,
                    &self.token_mint_0,
                    &self.token_mint_1,
                    new_balance_x - pool.reserve_0,
                    pool.reserve_1 - new_balance_y,
                )
            } else {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_1,
                    &self.pool_token_account_0,
                    &self.user_token_account_out,
                    &self.token_mint_1,
                    &self.token_mint_0,
                    new_balance_y - pool.reserve_1,
                    pool.reserve_0 - new_balance_x,
                )
            };

            // Update pool reserves
            pool.reserve_0 = new_balance_x;
            pool.reserve_1 = new_balance_y;

            let pool_token_mint_key_0 = pool.token_mint_0.key();
            let pool_token_mint_key_1 = pool.token_mint_1.key();

            let pool_seeds = &[
                &b"pool"[..], 
                pool_token_mint_key_0.as_ref(), 
                pool_token_mint_key_1.as_ref(),
                &[self.pool.bump],
            ];

            let signer_seeds = &[&pool_seeds[..]];

            // Perform token transfers
            transfer_checked(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: from_user_account.to_account_info(),
                        to: to_pool_account.to_account_info(),
                        authority: self.user.to_account_info(),
                        mint: from_mint.to_account_info(),
                    },
                ),
                amount_in,
                from_mint.decimals,
            )?;

            msg!("Swap direction: from {:?} to {:?}", from_mint.key(), to_mint.key());
            msg!("From user account: {:?}", from_user_account.key());
            msg!("To pool account: {:?}", to_pool_account.key());
            msg!("From pool account: {:?}", from_pool_account.key());
            msg!("To user account: {:?}", to_user_account.key());
            msg!("Pool authority: {:?}", self.pool.key());

            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: from_pool_account.to_account_info(),
                        to: to_user_account.to_account_info(),
                        authority: self.pool.to_account_info(),
                        mint: to_mint.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_out,
                to_mint.decimals,
            )?;

            Ok(())
        } else {
            Err(ErrorCode::InvalidProof.into())
        }
    }
}