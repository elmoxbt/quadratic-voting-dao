import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaQuadraticVotingDao } from "../target/types/solana_quadratic_voting_dao";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  mintToChecked,
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-quadratic-voting-dao", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaQuadraticVotingDao as Program<SolanaQuadraticVotingDao>;

  const daoName = "TestDAO";
  const quorumThreshold = new anchor.BN(10);

  let daoPda: anchor.web3.PublicKey;
  let governanceMint: anchor.web3.PublicKey;
  let proposalPda: anchor.web3.PublicKey;

  let voter1 = anchor.web3.Keypair.generate();
  let voter2 = anchor.web3.Keypair.generate();
  let voter3 = anchor.web3.Keypair.generate();

  it("Initializes the DAO with Token-2022 governance mint", async () => {
    [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("dao"), Buffer.from(daoName)],
      program.programId
    );

    [governanceMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("governance_mint"), daoPda.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initialize(daoName, quorumThreshold)
      .accounts({
        dao: daoPda,
        governanceMint: governanceMint,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize DAO transaction:", tx);

    const daoAccount = await program.account.dao.fetch(daoPda);
    assert.equal(daoAccount.name, daoName);
    assert.equal(daoAccount.quorumThreshold.toString(), quorumThreshold.toString());
    assert.equal(daoAccount.proposalCount.toString(), "0");
    assert.equal(daoAccount.governanceMint.toString(), governanceMint.toString());
  });

  it("Mints governance tokens to voters", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter3.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    const voters = [voter1, voter2, voter3];
    const mintAmounts = [100_000_000_000, 64_000_000_000, 36_000_000_000];

    for (let i = 0; i < voters.length; i++) {
      const voterAta = getAssociatedTokenAddressSync(
        governanceMint,
        voters[i].publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const daoSeeds = [Buffer.from("dao"), Buffer.from(daoName)];
      const [_, daoBump] = anchor.web3.PublicKey.findProgramAddressSync(
        daoSeeds,
        program.programId
      );

      await program.methods
        .mintGovernanceTokens(new anchor.BN(mintAmounts[i]))
        .accountsPartial({
          dao: daoPda,
          governanceMint: governanceMint,
          recipientTokenAccount: voterAta,
          recipient: voters[i].publicKey,
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`Minted ${mintAmounts[i] / 1e9} tokens to voter ${i + 1}`);
    }
  });

  it("Creates a proposal", async () => {
    const title = "Proposal #1: Increase Treasury Allocation";
    const description = "This proposal aims to increase the treasury allocation from 10% to 15% to fund more ecosystem grants.";
    const votingPeriod = new anchor.BN(5);

    const daoAccount = await program.account.dao.fetch(daoPda);

    [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        daoPda.toBuffer(),
        daoAccount.proposalCount.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const tx = await program.methods
      .createProposal(title, description, votingPeriod)
      .accounts({
        dao: daoPda,
        proposal: proposalPda,
        proposer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create proposal transaction:", tx);

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposalAccount.title, title);
    assert.equal(proposalAccount.description, description);
    assert.equal(proposalAccount.proposalId.toString(), "0");
    assert.equal(proposalAccount.yesVotes.toString(), "0");
    assert.equal(proposalAccount.noVotes.toString(), "0");
  });

  it("Voter 1 votes YES with 10 votes (costs 100 tokens)", async () => {
    const voteAmount = new anchor.BN(10);
    const support = true;

    const voter1Ata = getAssociatedTokenAddressSync(
      governanceMint,
      voter1.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPda.toBuffer(),
        voter1.publicKey.toBuffer()
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getTokenAccountBalance(voter1Ata);
    console.log("Voter 1 balance before vote:", balanceBefore.value.uiAmount);

    const tx = await program.methods
      .vote(voteAmount, support)
      .accounts({
        proposal: proposalPda,
        dao: daoPda,
        voteRecord: voteRecordPda,
        governanceMint: governanceMint,
        voterTokenAccount: voter1Ata,
        voter: voter1.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter1])
      .rpc();

    console.log("Vote transaction:", tx);

    const balanceAfter = await provider.connection.getTokenAccountBalance(voter1Ata);
    console.log("Voter 1 balance after vote:", balanceAfter.value.uiAmount);

    const burnedRaw = BigInt(balanceBefore.value.amount) - BigInt(balanceAfter.value.amount);
    const expectedCost = BigInt(100_000_000_000);
    assert.equal(burnedRaw.toString(), expectedCost.toString());

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposalAccount.yesVotes.toString(), "10");
    assert.equal(proposalAccount.totalVotesCast.toString(), "10");

    const voteRecord = await program.account.voteRecord.fetch(voteRecordPda);
    assert.equal(voteRecord.voteAmount.toString(), "10");
    assert.equal(voteRecord.tokensSpent.toString(), "100000000000");
    assert.equal(voteRecord.support, true);
  });

  it("Voter 2 votes NO with 8 votes (costs 64 tokens)", async () => {
    const voteAmount = new anchor.BN(8);
    const support = false;

    const voter2Ata = getAssociatedTokenAddressSync(
      governanceMint,
      voter2.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPda.toBuffer(),
        voter2.publicKey.toBuffer()
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getTokenAccountBalance(voter2Ata);

    await program.methods
      .vote(voteAmount, support)
      .accounts({
        proposal: proposalPda,
        dao: daoPda,
        voteRecord: voteRecordPda,
        governanceMint: governanceMint,
        voterTokenAccount: voter2Ata,
        voter: voter2.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    const balanceAfter = await provider.connection.getTokenAccountBalance(voter2Ata);
    const burnedRaw = BigInt(balanceBefore.value.amount) - BigInt(balanceAfter.value.amount);
    const expectedCost = BigInt(64_000_000_000);
    assert.equal(burnedRaw.toString(), expectedCost.toString());

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposalAccount.yesVotes.toString(), "10");
    assert.equal(proposalAccount.noVotes.toString(), "8");
    assert.equal(proposalAccount.totalVotesCast.toString(), "18");
  });

  it("Voter 3 votes YES with 6 votes (costs 36 tokens)", async () => {
    const voteAmount = new anchor.BN(6);
    const support = true;

    const voter3Ata = getAssociatedTokenAddressSync(
      governanceMint,
      voter3.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPda.toBuffer(),
        voter3.publicKey.toBuffer()
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getTokenAccountBalance(voter3Ata);

    await program.methods
      .vote(voteAmount, support)
      .accounts({
        proposal: proposalPda,
        dao: daoPda,
        voteRecord: voteRecordPda,
        governanceMint: governanceMint,
        voterTokenAccount: voter3Ata,
        voter: voter3.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter3])
      .rpc();

    const balanceAfter = await provider.connection.getTokenAccountBalance(voter3Ata);
    const burnedRaw = BigInt(balanceBefore.value.amount) - BigInt(balanceAfter.value.amount);
    const expectedCost = BigInt(36_000_000_000);
    assert.equal(burnedRaw.toString(), expectedCost.toString());

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposalAccount.yesVotes.toString(), "16");
    assert.equal(proposalAccount.noVotes.toString(), "8");
    assert.equal(proposalAccount.totalVotesCast.toString(), "24");
  });

  it("Fails to tally proposal while voting is still open", async () => {
    try {
      await program.methods
        .tallyProposal()
        .accounts({
          proposal: proposalPda,
          dao: daoPda,
        })
        .rpc();
      assert.fail("Should have failed - voting still open");
    } catch (err) {
      assert.include(err.toString(), "VotingStillOpen");
    }
  });

  it("Tallies proposal after voting period ends (proposal passes)", async () => {
    await new Promise(resolve => setTimeout(resolve, 6000));

    const tx = await program.methods
      .tallyProposal()
      .accounts({
        proposal: proposalPda,
        dao: daoPda,
      })
      .rpc();

    console.log("Tally proposal transaction:", tx);

    const updatedProposal = await program.account.proposal.fetch(proposalPda);

    console.log("Final results:");
    console.log("YES votes:", updatedProposal.yesVotes.toString());
    console.log("NO votes:", updatedProposal.noVotes.toString());
    console.log("Total votes:", updatedProposal.totalVotesCast.toString());
    console.log("State:", Object.keys(updatedProposal.state)[0]);

    assert.equal(updatedProposal.yesVotes.toString(), "16");
    assert.equal(updatedProposal.noVotes.toString(), "8");
    assert.ok("passed" in updatedProposal.state);
  });

  it("Executes the passed proposal", async () => {
    const tx = await program.methods
      .executeProposal()
      .accounts({
        proposal: proposalPda,
        dao: daoPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Execute proposal transaction:", tx);

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    assert.ok("executed" in proposalAccount.state);
  });

  it("Quadratic voting cost calculation test", () => {
    const testCases = [
      { votes: 1, cost: 1 },
      { votes: 2, cost: 4 },
      { votes: 3, cost: 9 },
      { votes: 5, cost: 25 },
      { votes: 10, cost: 100 },
      { votes: 100, cost: 10000 },
    ];

    console.log("\nQuadratic Voting Cost Table:");
    console.log("Votes | Token Cost (votes²)");
    console.log("------|-------------------");
    testCases.forEach(({ votes, cost }) => {
      console.log(`${votes.toString().padStart(5)} | ${cost.toString().padStart(10)}`);
      assert.equal(votes * votes, cost);
    });
  });
});
