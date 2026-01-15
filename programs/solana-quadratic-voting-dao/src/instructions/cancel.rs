use anchor_lang::prelude::*;
use crate::state::{Dao, Proposal, ProposalState};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub dao: Account<'info, Dao>,

    #[account(
        constraint = authority.key() == dao.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    require!(
        proposal.state == ProposalState::Active,
        ErrorCode::ProposalNotActive
    );

    proposal.state = ProposalState::Cancelled;

    msg!("Proposal {} cancelled by admin", proposal.proposal_id);
    Ok(())
}
