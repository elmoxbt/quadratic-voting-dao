use anchor_lang::prelude::*;
use crate::state::{Dao, Proposal, ProposalState};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub dao: Account<'info, Dao>,

    #[account(
        constraint = authority.key() == dao.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    require!(proposal.state == ProposalState::Passed, ErrorCode::ProposalNotPassed);

    proposal.state = ProposalState::Executed;

    msg!("Proposal {} executed", proposal.proposal_id);
    Ok(())
}
