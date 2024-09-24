use anchor_lang::prelude::*;

/// The main module for the Cyklon program.
///
/// This module contains the entry points for the Cyklon program, which implements
/// a decentralized exchange with confidential transactions.
///
/// # Parameters
///
/// * `initialize_pool` - Initializes a new liquidity pool.
///   - `tick_spacing`: The minimum tick separation for position and tick-indexed data. It determines
///     the granularity of price increments in the pool. A smaller tick spacing allows for finer price
///     movements but may increase gas costs for operations that iterate over tick ranges.
///   - `initial_sqrt_price`: The initial square root price of the pool.
///
/// * `add_liquidity` - Adds liquidity to an existing pool.
///   - `amount_0`: The amount of token 0 to add.
///   - `amount_1`: The amount of token 1 to add.
///   - `tick_lower`: The lower tick of the price range.
///   - `tick_upper`: The upper tick of the price range.
///
/// * `confidential_swap` - Performs a confidential swap in the pool.
///   - `amount_in_max`: The maximum amount of tokens to swap in.
///   - `minimum_amount_out`: The minimum amount of tokens to receive.
///   - `proof`: The zero-knowledge proof for the confidential swap.
///   - `public_inputs`: The public inputs for the zero-knowledge proof.

pub mod instructions;
pub mod state;
pub mod errors;
pub mod events;

use instructions::*;

declare_id!("5WrVRh6pUTvyrjrTn4GKGebsZn2GnqBK2h7agfn2QvBX");

#[program]
pub mod cyklon {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        ctx.accounts.initialize_pool()
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_0: u64, amount_1: u64) -> Result<()> {
        ctx.accounts.add_liquidity(amount_0, amount_1)
    }

    pub fn confidential_swap(ctx: Context<ConfidentialSwap>, proof: Vec<u8>, public_inputs: Vec<u128>) -> Result<()> {
        ctx.accounts.confidential_swap(proof, public_inputs)
    }
}
