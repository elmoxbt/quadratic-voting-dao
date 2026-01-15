use anchor_lang::prelude::*;

declare_id!("HTsUwP8nKSJJ5nJ627WVX1gj3HzxtgcCJuuzJSPxaRhq");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod solana_quadratic_voting_dao {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, quorum_threshold: u64) -> Result<()> {
        instructions::initialize::handler(ctx, name, quorum_threshold)
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        voting_period: i64,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, title, description, voting_period)
    }

    pub fn vote(ctx: Context<Vote>, vote_amount: u64, support: bool) -> Result<()> {
        instructions::vote::handler(ctx, vote_amount, support)
    }

    pub fn tally_proposal(ctx: Context<TallyProposal>) -> Result<()> {
        instructions::tally::handler(ctx)
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute::handler(ctx)
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        instructions::cancel::handler(ctx)
    }

    pub fn mint_governance_tokens(ctx: Context<MintGovernanceTokens>) -> Result<()> {
        instructions::mint_tokens::handler(ctx)
    }

    pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, user: Pubkey) -> Result<()> {
        instructions::whitelist::add_to_whitelist(ctx, user)
    }

    pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>) -> Result<()> {
        instructions::whitelist::remove_from_whitelist(ctx)
    }
}
