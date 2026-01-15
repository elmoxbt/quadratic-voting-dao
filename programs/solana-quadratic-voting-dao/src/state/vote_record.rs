use anchor_lang::prelude::*;

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote_amount: u64,
    pub support: bool,
    pub timestamp: i64,
    pub tokens_spent: u64,
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 1;
}
