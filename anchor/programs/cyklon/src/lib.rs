use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;
mod events;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod cyklon {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, tick_spacing: u16, initial_sqrt_price: u128) -> Result<()> {
        ctx.accounts.initialize_pool(tick_spacing, initial_sqrt_price)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_0: u64, amount_1: u64, tick_lower: i32, tick_upper: i32) -> Result<()> {
        ctx.accounts.add_liquidity(amount_0, amount_1, tick_lower, tick_upper)
    }

    pub fn confidential_swap(ctx: Context<ConfidentialSwap>, amount_in_max: u64, minimum_amount_out: u64, proof: Vec<u8>, public_inputs: Vec<u128>) -> Result<()> {
        ctx.accounts.confidential_swap(amount_in_max, minimum_amount_out, proof, public_inputs)
    }
}
