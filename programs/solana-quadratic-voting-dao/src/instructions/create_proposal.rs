use anchor_lang::prelude::*;
use crate::state::{Dao, Proposal, ProposalState};
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub dao: Account<'info, Dao>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", dao.key().as_ref(), dao.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
    voting_period: i64,
) -> Result<()> {
    require!(title.len() <= 200, ErrorCode::TitleTooLong);
    require!(description.len() <= 1000, ErrorCode::DescriptionTooLong);
    require!(voting_period > 0, ErrorCode::InvalidVotingPeriod);

    let dao = &mut ctx.accounts.dao;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    proposal.dao = dao.key();
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.title = title;
    proposal.description = description;
    proposal.start_time = clock.unix_timestamp;
    proposal.end_time = clock.unix_timestamp.checked_add(voting_period)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.total_votes_cast = 0;
    proposal.state = ProposalState::Active;
    proposal.proposal_id = dao.proposal_count;
    proposal.bump = ctx.bumps.proposal;

    dao.proposal_count = dao.proposal_count.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    msg!("Proposal {} created: {}", proposal.proposal_id, proposal.title);
    Ok(())
}
