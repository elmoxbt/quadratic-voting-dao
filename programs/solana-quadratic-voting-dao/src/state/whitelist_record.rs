use anchor_lang::prelude::*;

#[account]
pub struct WhitelistRecord {
    pub user: Pubkey,
    pub whitelisted: bool,
    pub bump: u8,
}

impl WhitelistRecord {
    pub const LEN: usize = 8 + 32 + 1 + 1;
}
