use anchor_lang::prelude::*;

#[account]
pub struct Proposal {
    pub dao: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub total_votes_cast: u64,
    pub state: ProposalState,
    pub proposal_id: u64,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + 32 + 32 + (4 + 200) + (4 + 1000) + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalState {
    Active,
    Passed,
    Rejected,
    Executed,
    Cancelled,
    QuorumNotMet,
}
