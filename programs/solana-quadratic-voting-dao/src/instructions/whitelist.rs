use anchor_lang::prelude::*;
use crate::state::{Dao, WhitelistRecord};
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct AddToWhitelist<'info> {
    #[account(
        seeds = [b"dao", dao.name.as_bytes()],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        init,
        payer = authority,
        space = WhitelistRecord::LEN,
        seeds = [b"whitelist", dao.key().as_ref(), user.as_ref()],
        bump
    )]
    pub whitelist_record: Account<'info, WhitelistRecord>,

    #[account(
        mut,
        constraint = authority.key() == dao.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveFromWhitelist<'info> {
    #[account(
        seeds = [b"dao", dao.name.as_bytes()],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        mut,
        seeds = [b"whitelist", dao.key().as_ref(), whitelist_record.user.as_ref()],
        bump = whitelist_record.bump,
        close = authority
    )]
    pub whitelist_record: Account<'info, WhitelistRecord>,

    #[account(
        mut,
        constraint = authority.key() == dao.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist_record = &mut ctx.accounts.whitelist_record;
    whitelist_record.user = user;
    whitelist_record.whitelisted = true;
    whitelist_record.bump = ctx.bumps.whitelist_record;

    msg!("User {} added to whitelist", user);
    Ok(())
}

pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>) -> Result<()> {
    msg!("User {} removed from whitelist", ctx.accounts.whitelist_record.user);
    Ok(())
}
