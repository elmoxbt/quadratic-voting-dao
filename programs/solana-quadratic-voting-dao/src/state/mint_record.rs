use anchor_lang::prelude::*;

#[account]
pub struct MintRecord {
    pub user: Pubkey,
    pub last_mint_time: i64,
    pub bump: u8,
}

impl MintRecord {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}
