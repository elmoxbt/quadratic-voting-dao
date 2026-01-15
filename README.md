# Solana Quadratic Voting DAO

A fully on-chain quadratic voting system built on Solana. Prevents whale dominance and promotes fair representation in DAO governance.

![Solana](https://img.shields.io/badge/Solana-black?style=flat&logo=solana&logoColor=14F195)
![Anchor](https://img.shields.io/badge/Anchor-0.31-blue)
![Rust](https://img.shields.io/badge/Rust-orange?style=flat&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)

## Live App

**[Try it live on Devnet](https://quadratic-voting-dao.vercel.app)**

Connect your wallet, mint governance tokens, and create/vote on proposals.

## Features

- **Quadratic Voting** — Vote cost = votes². 1 vote = 1 token, 10 votes = 100 tokens
- **Token-Gated Governance** — Whitelist-based access control for voting
- **Anti-Whale Mechanism** — Mint cap (100 tokens) + 24h cooldown prevents accumulation
- **SPL Token-2022** — Governance tokens with built-in burn on vote

## Architecture

```
                    Frontend (React + Vite)
                            |
                    Wallet Adapter
                            |
                    Anchor Client
                            |
            Solana Program (Rust + Anchor)
                            |
        DAO State    Proposals    Vote Records
            |            |              |
                  SPL Token-2022
                  (Governance Token)
```

**Program Instructions:**
- `initialize_dao` — Create DAO with governance token
- `create_proposal` — Submit new proposal with voting period
- `cast_vote` — Vote on proposal (tokens burned quadratically)
- `mint_tokens` — Mint governance tokens (with cooldown)
- `add_to_whitelist` — Grant voting access

## Tech Stack

**Smart Contract:** Rust, Anchor 0.31

**Frontend:** React 18, TypeScript, Vite

**Blockchain:** Solana (Devnet)

**Token Standard:** SPL Token-2022

**Wallet:** Solana Wallet Adapter

## Quickstart

### Prerequisites

- Rust & Cargo
- Solana CLI
- Anchor CLI 0.31+
- Node.js 18+

### Local Development

```bash
# Clone
git clone https://github.com/elmoxbt/quadratic-voting-dao.git
cd solana-quadratic-voting-dao

# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Start frontend
cd app
npm install
npm run dev
```

## How Quadratic Voting Works

| Votes | Cost (tokens) |
|-------|---------------|
| 1     | 1             |
| 5     | 25            |
| 10    | 100           |
| 20    | 400           |

More votes = exponentially higher cost. This gives smaller holders meaningful influence while still allowing conviction voting.

## Open to Collaboration

Building in DeFi, RWA tokenization, payments, or AI agents? Let's connect.

## License

[ISC](LICENSE)

---

**X**: [@elmoxbt](https://x.com/elmoxbt) | **Email**: elmoxbt@gmail.com
