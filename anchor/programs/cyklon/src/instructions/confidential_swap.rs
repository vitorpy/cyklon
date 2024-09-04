use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked};
use crate::state::Pool;
use crate::errors::ErrorCode;
use crate::events::ConfidentialSwapEvent;

#[derive(Accounts)]
pub struct ConfidentialSwap<'info> {
    #[account(mut,
        seeds = [b"pool"],
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
    pub token_mint_0: Account<'info, Mint>,
    #[account(mut)]
    pub token_mint_1: Account<'info, Mint>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, AssociatedToken>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Helper function to verify the zero-knowledge proof (placeholder)
fn verify_proof(proof: &[u8], public_inputs: &[u128]) -> bool {
    use sha3::{Digest, Keccak256};
    
    let mut hasher = Keccak256::new();
    hasher.update(proof);
    for &input in public_inputs {
        hasher.update(&input.to_le_bytes());
    }
    let result = hasher.finalize();
    result[0] == 0 && result[1] == 0 // Arbitrary check for example purposes
}

impl<'info> ConfidentialSwap<'info> {
    pub fn confidential_swap(
        &mut self,
        amount_in_max: u64,
        minimum_amount_out: u64,
        proof: Vec<u8>,
        public_inputs: Vec<u128>,
    ) -> Result<()> {
        let pool = &mut self.pool;
        
        // Verify the zero-knowledge proof
        require!(verify_proof(&proof, &public_inputs), ErrorCode::InvalidProof);

        // Extract values from public inputs
        let new_sqrt_price = public_inputs[1];
        let amount_out = public_inputs[2] as u64;

        // Ensure the swap meets the minimum amount out
        require!(amount_out >= minimum_amount_out, ErrorCode::SlippageExceeded);

        // Update pool state
        pool.sqrt_price = new_sqrt_price;

        // Determine swap direction based on token accounts
        let zero_for_one = self.user_token_account_in.mint == pool.token_mint_0;

        // Find the canonical PDA for the pool
        let (_, bump) = Pubkey::find_program_address(&[b"pool"], &crate::ID);

        // Transfer tokens
        if zero_for_one {
            // Transfer up to amount_in_max of token 0 from user to pool
            transfer_checked(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.user_token_account_in.to_account_info(),
                        to: self.pool_token_account_0.to_account_info(),
                        authority: self.user.to_account_info(),
                        mint: self.token_mint_0.to_account_info(),
                    },
                ),
                amount_in_max,
                9
            )?;

            // Transfer amount_out of token 1 from pool to user
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.pool_token_account_1.to_account_info(),
                        to: self.user_token_account_out.to_account_info(),
                        authority: self.pool.to_account_info(),
                        mint: self.token_mint_1.to_account_info(),
                    },
                    &[&[b"pool", &[bump]]],
                ),
                amount_out,
                9
            )?;
        } else {
            // Transfer up to amount_in_max of token 1 from user to pool
            transfer_checked(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.user_token_account_in.to_account_info(),
                        to: self.pool_token_account_1.to_account_info(),
                        authority: self.user.to_account_info(),
                        mint: self.token_mint_1.to_account_info(),
                    },
                ),
                amount_in_max,
                9
            )?;

            // Transfer amount_out of token 0 from pool to user
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.pool_token_account_0.to_account_info(),
                        to: self.user_token_account_out.to_account_info(),
                        authority: self.pool.to_account_info(),
                        mint: self.token_mint_0.to_account_info(),
                    },
                    &[&[b"pool", &[bump]]],
                ),
                amount_out,
                9
            )?;
        }

        emit!(ConfidentialSwapEvent {
            user: self.user.key(),
            amount_out,
            new_sqrt_price,
        });

        Ok(())
    }
}