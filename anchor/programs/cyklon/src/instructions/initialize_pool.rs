use anchor_lang::prelude::*;
use anchor_spl::token::{Mint as SplMint, initialize_mint, InitializeMint, Token as SplToken};
use anchor_spl::token_interface::Mint;
use anchor_lang::system_program::{create_account, CreateAccount};
use mpl_token_metadata::instructions::CreateMetadataAccountV3CpiBuilder;
use mpl_token_metadata::types::DataV2;
use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID;

use crate::state::Pool;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = payer, space = 8 + Pool::INIT_SPACE, seeds = [b"pool", token_mint_x.key().as_ref(), token_mint_y.key().as_ref()], bump)]
    pub pool: Account<'info, Pool>,
    pub token_mint_x: InterfaceAccount<'info, Mint>,
    pub token_mint_y: InterfaceAccount<'info, Mint>,
    /// CHECK: PDA will be checked in the instruction handler.
    #[account(
        mut,
        seeds = [b"lp", token_mint_x.key().as_ref(), token_mint_y.key().as_ref()],
        bump
    )]
    pub token_mint_lp: UncheckedAccount<'info>,
    ///CHECK: This account is checked in the instruction
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), token_mint_lp.key().as_ref()],
        bump,
        seeds::program = TOKEN_METADATA_PROGRAM_ID
    )]
    pub metadata_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub lp_token_program: Program<'info, SplToken>,
    /// CHECK: metaplex account
    #[account(address = mpl_token_metadata::ID)]
    pub mpl_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitializePool<'info> {
    pub fn initialize_pool(
        &mut self,
        bump: u8,
    ) -> Result<()> {
        if self.token_mint_x.key() >= self.token_mint_y.key() {
            return Err(ErrorCode::InvalidTokenOrder.into());
        }

        let pool = &mut self.pool;
        pool.token_mint_x = self.token_mint_x.key();
        pool.token_mint_y = self.token_mint_y.key();
        pool.bump = bump;

        let token_mint_x = self.token_mint_x.key();
        let token_mint_y = self.token_mint_y.key();
        let lp_seed = &[b"lp", token_mint_x.as_ref(), token_mint_y.as_ref()];
        let (lp_address, lp_bump) = Pubkey::find_program_address(lp_seed, &crate::ID);
        if lp_address != self.token_mint_lp.key() {
            return Err(ErrorCode::InvalidLpMint.into());
        }
        
        let lp_account_info = self.token_mint_lp.to_account_info();
        if lp_account_info.data_len() != SplMint::LEN {
            self.initialize_lp_mint(&self.token_mint_x.key(), &self.token_mint_y.key(), lp_bump)?;
        }

        Ok(())
    }
    
    fn initialize_lp_mint(&self, token_mint_x: &Pubkey, token_mint_y: &Pubkey, lp_bump: u8) -> Result<()> {
        // Create the mint account
        let rent = Rent::get()?;
        let space = SplMint::LEN;
        let lamports = rent.minimum_balance(space);

        let signer_seeds = &[
            b"lp",
            token_mint_x.as_ref(),
            token_mint_y.as_ref(),
            &[lp_bump],
        ];

        create_account(
            CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                CreateAccount {
                    from: self.payer.to_account_info(),
                    to: self.token_mint_lp.to_account_info(),
                },
                &[&signer_seeds[..]]
            ),
            lamports,
            space as u64,
            &self.lp_token_program.key, // Mint needs to be owned by the token program
        )?;

        // Initialize the mint
        initialize_mint(
            CpiContext::new_with_signer(
                self.lp_token_program.to_account_info(),
                InitializeMint {
                    mint: self.token_mint_lp.to_account_info(),
                    rent: self.rent.to_account_info(),
                },
                &[&signer_seeds[..]]
            ),
            9,
            &self.pool.key(),
            None,
        )?;
        
        let data = DataV2 {
            // TODO: Update with name and symbol of the pool
            name: "Darklake LP Token".to_string(),
            symbol: "DLLP".to_string(),
            // TODO: Make this an API call to get the pool metadata
            uri: "https://darklake.fi".to_string(),
            seller_fee_basis_points:0,
            creators:None,
            collection:None,
            uses:None,
        };

        let token_mint_lp_key = self.token_mint_lp.key();

        let metadata_seeds = &[
            b"metadata",
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            token_mint_lp_key.as_ref(),
        ];
        let (metadata_address, _) = Pubkey::find_program_address(metadata_seeds, &TOKEN_METADATA_PROGRAM_ID);

        if metadata_address != self.metadata_account.key() {
            return Err(ErrorCode::InvalidMetadataAccount.into());
        }

        let pool_seeds = &[
            b"pool",
            token_mint_x.as_ref(),
            token_mint_y.as_ref(),
            &[self.pool.bump],
        ];

        CreateMetadataAccountV3CpiBuilder::new(&self.mpl_program)
            .metadata(&self.metadata_account.to_account_info())
            .mint(&self.token_mint_lp.to_account_info())
            .mint_authority(&self.pool.to_account_info())
            .payer(&self.payer.to_account_info())
            .update_authority(&self.pool.to_account_info(), true)
            .is_mutable(true)
            .data(data)
            .system_program(&self.system_program.to_account_info())
            .invoke_signed(&[&pool_seeds[..], &signer_seeds[..]])?;

        Ok(())
    }
}
