use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};
use crate::state::{Dao, Proposal, ProposalState, VoteRecord, WhitelistRecord};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub dao: Account<'info, Dao>,

    #[account(
        seeds = [b"whitelist", dao.key().as_ref(), voter.key().as_ref()],
        bump = whitelist_record.bump,
        constraint = whitelist_record.whitelisted @ ErrorCode::NotWhitelisted
    )]
    pub whitelist_record: Account<'info, WhitelistRecord>,

    #[account(
        init,
        payer = voter,
        space = VoteRecord::LEN,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        constraint = governance_mint.key() == dao.governance_mint @ ErrorCode::InvalidGovernanceMint
    )]
    pub governance_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = governance_mint,
        associated_token::authority = voter,
        associated_token::token_program = token_program
    )]
    pub voter_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Vote>,
    vote_amount: u64,
    support: bool,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote_record = &mut ctx.accounts.vote_record;
    let clock = Clock::get()?;

    require!(
        clock.unix_timestamp >= proposal.start_time && clock.unix_timestamp <= proposal.end_time,
        ErrorCode::VotingClosed
    );
    require!(proposal.state == ProposalState::Active, ErrorCode::ProposalNotActive);
    require!(vote_amount > 0, ErrorCode::InvalidVoteAmount);

    // Quadratic cost: cost = votes² * 10^decimals
    let votes_squared = vote_amount.checked_mul(vote_amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    let decimals = ctx.accounts.governance_mint.decimals;
    let decimal_multiplier = 10u64.checked_pow(decimals as u32)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    let token_cost = votes_squared.checked_mul(decimal_multiplier)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    require!(
        ctx.accounts.voter_token_account.amount >= token_cost,
        ErrorCode::InsufficientTokens
    );

    // Burn tokens (quadratic cost)
    let cpi_accounts = token_2022::Burn {
        mint: ctx.accounts.governance_mint.to_account_info(),
        from: ctx.accounts.voter_token_account.to_account_info(),
        authority: ctx.accounts.voter.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token_2022::burn(cpi_ctx, token_cost)?;

    if support {
        proposal.yes_votes = proposal.yes_votes.checked_add(vote_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
    } else {
        proposal.no_votes = proposal.no_votes.checked_add(vote_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
    }
    proposal.total_votes_cast = proposal.total_votes_cast.checked_add(vote_amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    vote_record.voter = ctx.accounts.voter.key();
    vote_record.proposal = proposal.key();
    vote_record.vote_amount = vote_amount;
    vote_record.support = support;
    vote_record.timestamp = clock.unix_timestamp;
    vote_record.tokens_spent = token_cost;
    vote_record.bump = ctx.bumps.vote_record;

    msg!(
        "Vote recorded: {} votes ({} support) costing {} tokens",
        vote_amount,
        if support { "YES" } else { "NO" },
        token_cost
    );
    Ok(())
}
