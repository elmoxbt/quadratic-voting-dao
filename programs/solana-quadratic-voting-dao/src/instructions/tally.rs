use anchor_lang::prelude::*;
use crate::state::{Dao, Proposal, ProposalState};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct TallyProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub dao: Account<'info, Dao>,
}

pub fn handler(ctx: Context<TallyProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let dao = &ctx.accounts.dao;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp > proposal.end_time, ErrorCode::VotingStillOpen);
    require!(proposal.state == ProposalState::Active, ErrorCode::ProposalNotActive);

    let quorum_met = proposal.total_votes_cast >= dao.quorum_threshold;
    let passed = quorum_met && proposal.yes_votes > proposal.no_votes;

    proposal.state = if passed {
        ProposalState::Passed
    } else if !quorum_met {
        ProposalState::QuorumNotMet
    } else {
        ProposalState::Rejected
    };

    msg!(
        "Proposal {} tallied: {} (Yes: {}, No: {}, Quorum: {})",
        proposal.proposal_id,
        match proposal.state {
            ProposalState::Passed => "PASSED",
            ProposalState::Rejected => "REJECTED",
            ProposalState::QuorumNotMet => "QUORUM_NOT_MET",
            _ => "UNKNOWN"
        },
        proposal.yes_votes,
        proposal.no_votes,
        proposal.total_votes_cast
    );
    Ok(())
}
