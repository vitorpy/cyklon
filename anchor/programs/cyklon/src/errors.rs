use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Lower tick must be less than upper tick")]
    InvalidTickRange,
    #[msg("Lower tick must be a multiple of tick spacing")]
    InvalidLowerTick,
    #[msg("Upper tick must be a multiple of tick spacing")]
    InvalidUpperTick,
    #[msg("Invalid zero-knowledge proof")]
    InvalidProof,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Math overflow")]
    MathOverflow,
}
