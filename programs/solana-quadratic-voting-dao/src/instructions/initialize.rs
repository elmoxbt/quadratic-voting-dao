use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;
use crate::state::Dao;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Dao::LEN,
        seeds = [b"dao", name.as_bytes()],
        bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = dao,
        mint::token_program = token_program,
        seeds = [b"governance_mint", dao.key().as_ref()],
        bump
    )]
    pub governance_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, name: String, quorum_threshold: u64) -> Result<()> {
    let dao = &mut ctx.accounts.dao;
    dao.authority = ctx.accounts.authority.key();
    dao.governance_mint = ctx.accounts.governance_mint.key();
    dao.name = name;
    dao.proposal_count = 0;
    dao.quorum_threshold = quorum_threshold;
    dao.bump = ctx.bumps.dao;

    msg!("DAO initialized with governance mint: {}", dao.governance_mint);
    Ok(())
}
