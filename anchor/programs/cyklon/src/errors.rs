use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input")]
    InvalidInput,
    #[msg("Invalid proof")]
    InvalidProof,
    #[msg("Lower tick must be less than upper tick")]
    InvalidTickRange,
    #[msg("Lower tick must be a multiple of tick spacing")]
    InvalidLowerTick,
    #[msg("Upper tick must be a multiple of tick spacing")]
    InvalidUpperTick,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unable to create Groth16Verifier")]
    InvalidGroth16Verifier,
    #[msg("Invalid token order")]
    InvalidTokenOrder,
    #[msg("Invalid swap amount")]
    InvalidSwapAmount,
}
