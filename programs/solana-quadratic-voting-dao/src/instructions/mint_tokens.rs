use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Dao, MintRecord};
use crate::error::ErrorCode;

const COOLDOWN_PERIOD: i64 = 86400;

#[derive(Accounts)]
pub struct MintGovernanceTokens<'info> {
    #[account(
        seeds = [b"dao", dao.name.as_bytes()],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        mut,
        constraint = governance_mint.key() == dao.governance_mint @ ErrorCode::InvalidGovernanceMint
    )]
    pub governance_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = governance_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = recipient,
        space = MintRecord::LEN,
        seeds = [b"mint_record", recipient.key().as_ref()],
        bump
    )]
    pub mint_record: Account<'info, MintRecord>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintGovernanceTokens>) -> Result<()> {
    let current_balance = ctx.accounts.recipient_token_account.amount;
    let balance_threshold: u64 = 50_000_000_000;
    let max_balance: u64 = 100_000_000_000;
    let mint_amount: u64 = 100_000_000_000;
    let clock = Clock::get()?;
    let mint_record = &mut ctx.accounts.mint_record;

    if mint_record.last_mint_time > 0 {
        let time_since_last_mint = clock.unix_timestamp - mint_record.last_mint_time;
        require!(
            time_since_last_mint >= COOLDOWN_PERIOD,
            ErrorCode::MintCooldownActive
        );
    }

    require!(
        current_balance < balance_threshold,
        ErrorCode::BalanceTooHigh
    );

    require!(
        current_balance < max_balance,
        ErrorCode::MintCapReached
    );

    let new_balance = current_balance.checked_add(mint_amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    require!(
        new_balance <= max_balance,
        ErrorCode::MintCapReached
    );

    let dao = &ctx.accounts.dao;
    let dao_seeds = &[
        b"dao",
        dao.name.as_bytes(),
        &[dao.bump],
    ];
    let signer_seeds = &[&dao_seeds[..]];

    let cpi_accounts = token_2022::MintTo {
        mint: ctx.accounts.governance_mint.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: dao.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token_2022::mint_to(cpi_ctx, mint_amount)?;

    mint_record.user = ctx.accounts.recipient.key();
    mint_record.last_mint_time = clock.unix_timestamp;
    mint_record.bump = ctx.bumps.mint_record;

    msg!("Minted {} tokens to {}", mint_amount, ctx.accounts.recipient.key());
    Ok(())
}
