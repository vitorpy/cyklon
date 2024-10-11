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
    pub token_mint_0_program: Interface<'info, TokenInterface>,
    pub token_mint_1_program: Interface<'info, TokenInterface>,
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

        // Extract necessary values before mutable borrow
        let decimals_0 = self.token_mint_0.decimals;
        let decimals_1 = self.token_mint_1.decimals;
        let reserve_0 = self.pool.reserve_0;
        let reserve_1 = self.pool.reserve_1;

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
            // Extract normalized values from public inputs
            let normalized_new_balance_x = u64::from_be_bytes(public_inputs[0][24..].try_into().unwrap());
            let normalized_new_balance_y = u64::from_be_bytes(public_inputs[1][24..].try_into().unwrap());
            let is_swap_x_to_y = u64::from_be_bytes(public_inputs[2][24..].try_into().unwrap()) != 0;
            
            msg!("Normalized new balance x: {}", normalized_new_balance_x); 
            msg!("Normalized new balance y: {}", normalized_new_balance_y);
            msg!("Is swap X to Y: {}", is_swap_x_to_y);
            
            // Denormalize the balances
            let new_balance_x = Self::denormalize_amount(normalized_new_balance_x, decimals_0);
            let new_balance_y = Self::denormalize_amount(normalized_new_balance_y, decimals_1);
            
            msg!("New balance x: {}", new_balance_x);
            msg!("New balance y: {}", new_balance_y);
            
            // Determine swap direction and calculate amount_in and amount_out
            let (from_user_account, to_pool_account, from_pool_account, to_user_account, from_mint, to_mint, amount_in, amount_out, from_token_program, to_token_program) = if is_swap_x_to_y {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_1,
                    &self.pool_token_account_0,
                    &self.user_token_account_out,
                    &self.token_mint_1,
                    &self.token_mint_0,
                    new_balance_y - reserve_1,
                    reserve_0 - new_balance_x,
                    &self.token_mint_1_program,
                    &self.token_mint_0_program,
                )
            } else {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_0,
                    &self.pool_token_account_1,
                    &self.user_token_account_out,
                    &self.token_mint_0,
                    &self.token_mint_1,
                    new_balance_x - reserve_0,
                    reserve_1 - new_balance_y,
                    &self.token_mint_0_program,
                    &self.token_mint_1_program,
                )
            };

            // Update pool reserves
            self.pool.reserve_0 = new_balance_x;
            self.pool.reserve_1 = new_balance_y;

            let pool_token_mint_key_0 = self.pool.token_mint_0.key();
            let pool_token_mint_key_1 = self.pool.token_mint_1.key();

            let pool_seeds = &[
                &b"pool"[..], 
                pool_token_mint_key_0.as_ref(), 
                pool_token_mint_key_1.as_ref(),
                &[self.pool.bump],
            ];

            let signer_seeds = &[&pool_seeds[..]];

            msg!("Performing token transfers");

            msg!("From: {:?}", from_user_account.to_account_info().key());
            msg!("To: {:?}", to_pool_account.to_account_info().key());
            msg!("Authority: {:?}", self.user.to_account_info().key());
            msg!("Mint: {:?}", from_mint.to_account_info().key());
            msg!("Amount: {:?}", amount_in);
            msg!("Decimals: {:?}", from_mint.decimals); 

            // Perform token transfers
            transfer_checked(
                CpiContext::new(
                    from_token_program.to_account_info(),
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

            msg!("To: {:?}", to_user_account.to_account_info().key());
            msg!("Authority: {:?}", self.pool.to_account_info().key());
            msg!("Mint: {:?}", to_mint.to_account_info().key());
            msg!("Amount: {:?}", amount_out);
            msg!("Decimals: {:?}", to_mint.decimals);

            transfer_checked(
                CpiContext::new_with_signer(
                    to_token_program.to_account_info(),
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

    // Helper function to denormalize amounts
    fn denormalize_amount(normalized_amount: u64, decimals: u8) -> u64 {
        let normalization_factor = 10u64.pow(9 - decimals as u32);
        normalized_amount / normalization_factor
    }
}