use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked};

use crate::state::Pool;
use crate::errors::ErrorCode;

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
        proof: Vec<u8>,
        public_inputs: Vec<u128>,
    ) -> Result<()> {
        // Verify the ZK proof
        let is_proof_valid = verify_proof(&proof, &public_inputs);

        if is_proof_valid {
            let pool = &mut self.pool;
            let [public_reserve_0, public_reserve_1, public_amount_in_max, public_minimum_amount_out] = public_inputs[..4] else {
                return Err(ErrorCode::InvalidInput.into());
            };

            // Ensure public inputs match the current pool state
            require!(
                public_reserve_0 == pool.reserve_0 as u128 && public_reserve_1 == pool.reserve_1 as u128,
                ErrorCode::InvalidInput
            );

            // The actual amount_in and direction (zero_for_one) are kept private in the circuit
            // Here we only update the pool state based on the public outputs from the circuit
            let new_reserve_0 = public_inputs[4];
            let new_reserve_1 = public_inputs[5];
            let amount_in = public_inputs[6];
            let amount_out = public_inputs[7];

            // Update pool reserves
            pool.reserve_0 = new_reserve_0 as u64;
            pool.reserve_1 = new_reserve_1 as u64;

            // Perform token transfers
            let (from_account, to_account, from_mint, to_mint) = if new_reserve_0 > public_reserve_0 {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_0,
                    &self.token_mint_0,
                    &self.token_mint_1,
                )
            } else {
                (
                    &self.user_token_account_in,
                    &self.pool_token_account_1,
                    &self.token_mint_1,
                    &self.token_mint_0,
                )
            };

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
                amount_in as u64,
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
                amount_out as u64,
                to_mint.decimals,
            )?;

            Ok(())
        } else {
            Err(ErrorCode::InvalidProof.into())
        }
    }
}