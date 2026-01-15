import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaQuadraticVotingDao } from "../target/types/solana_quadratic_voting_dao";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaQuadraticVotingDao as Program<SolanaQuadraticVotingDao>;

  console.log("Deploying Quadratic Voting DAO to Devnet...\n");
  console.log("Program ID:", program.programId.toString());
  console.log("Deployer:", provider.wallet.publicKey.toString());
  console.log("\n");

  const daoName = "MainDAO";
  const quorumThreshold = new anchor.BN(10);

  const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("dao"), Buffer.from(daoName)],
    program.programId
  );

  const [governanceMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("governance_mint"), daoPda.toBuffer()],
    program.programId
  );

  try {
    await program.account.dao.fetch(daoPda);
    console.log("DAO already initialized!");
    console.log("DAO PDA:", daoPda.toString());
    console.log("Governance Mint:", governanceMint.toString());
  } catch {
    console.log("Initializing DAO...");

    const tx = await program.methods
      .initialize(daoName, quorumThreshold)
      .accountsStrict({
        dao: daoPda,
        governanceMint: governanceMint,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("DAO Initialized!");
    console.log("Transaction:", tx);
    console.log("DAO PDA:", daoPda.toString());
    console.log("Governance Mint:", governanceMint.toString());
    console.log("Quorum Threshold:", quorumThreshold.toString());
  }

  console.log("\nDeployment Summary:");
  console.log("Program ID:", program.programId.toString());
  console.log("DAO PDA:", daoPda.toString());
  console.log("Governance Mint:", governanceMint.toString());
  console.log("Network: Devnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
