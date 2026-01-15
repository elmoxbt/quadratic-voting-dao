use anchor_lang::prelude::*;

#[account]
pub struct Dao {
    pub authority: Pubkey,
    pub governance_mint: Pubkey,
    pub name: String,
    pub proposal_count: u64,
    pub quorum_threshold: u64,
    pub bump: u8,
}

impl Dao {
    pub const LEN: usize = 8 + 32 + 32 + (4 + 100) + 8 + 8 + 1;
}
