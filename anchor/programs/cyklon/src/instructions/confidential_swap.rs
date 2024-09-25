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
        public_inputs: [[u8; 32]; 2], // Changed to fixed-size array
    ) -> Result<()> {
        // Create a new Groth16Verifier instance
        let mut verifier = Groth16Verifier::new(
            &proof_a,
            &proof_b,
            &proof_c,
            &public_inputs,
            &VERIFYINGKEY,
        ).map_err(|_| ErrorCode::InvalidProof)?;

        // Verify the proof
        let verified = verifier.verify().map_err(|_| ErrorCode::InvalidProof)?;

        if verified {
            let pool = &mut self.pool;
            
            // Extract values from public inputs
            // We'll use only the last 8 bytes of each 32-byte input for u64 conversion
            let new_balance_x = u64::from_be_bytes(public_inputs[0][24..].try_into().unwrap());
            let new_balance_y = u64::from_be_bytes(public_inputs[1][24..].try_into().unwrap());
            
            // Determine swap direction and calculate amount_in and amount_out
            let (from_account, to_account, from_mint, to_mint, amount_in, amount_out) = if new_balance_x > pool.reserve_0 {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_0,
                    &self.token_mint_0,
                    &self.token_mint_1,
                    new_balance_x - pool.reserve_0,
                    pool.reserve_1 - new_balance_y,
                )
            } else {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_1,
                    &self.token_mint_1,
                    &self.token_mint_0,
                    new_balance_y - pool.reserve_1,
                    pool.reserve_0 - new_balance_x,
                )
            };

            // Update pool reserves
            pool.reserve_0 = new_balance_x;
            pool.reserve_1 = new_balance_y;

            // Perform token transfers
            transfer_checked(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: from_account.to_account_info(),
                        to: to_account.to_account_info(),
                        authority: self.user.to_account_info(),
                        mint: from_mint.to_account_info(),
                    },
                ),
                amount_in,
                from_mint.decimals,
            )?;

            transfer_checked(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: to_account.to_account_info(),
                        to: self.user_token_account_out.to_account_info(),
                        authority: self.pool.to_account_info(),
                        mint: to_mint.to_account_info(),
                    },
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