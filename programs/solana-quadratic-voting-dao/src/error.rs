use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Title too long (max 200 characters)")]
    TitleTooLong,
    #[msg("Description too long (max 1000 characters)")]
    DescriptionTooLong,
    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    #[msg("Voting period has closed")]
    VotingClosed,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Invalid vote amount")]
    InvalidVoteAmount,
    #[msg("Insufficient governance tokens")]
    InsufficientTokens,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Voting is still open")]
    VotingStillOpen,
    #[msg("Proposal has not passed")]
    ProposalNotPassed,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid governance mint")]
    InvalidGovernanceMint,
    #[msg("Balance too high to mint (must be below 50 tokens)")]
    BalanceTooHigh,
    #[msg("Cannot exceed maximum balance of 100 tokens")]
    MintCapReached,
    #[msg("Must wait 24 hours between mints")]
    MintCooldownActive,
    #[msg("User not whitelisted")]
    NotWhitelisted,
}
