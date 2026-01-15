import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import { useToast } from '../contexts/ToastContext'
import * as anchor from '@coral-xyz/anchor'
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

interface Props {
  proposalPda: anchor.web3.PublicKey
  onVoted: () => void
}

export default function VoteForm({ proposalPda, onVoted }: Props) {
  const { publicKey } = useWallet()
  const program = useAnchorProgram()
  const { showToast } = useToast()

  const [voteAmount, setVoteAmount] = useState('1')
  const [support, setSupport] = useState(true)
  const [loading, setLoading] = useState(false)

  const calculateCost = (votes: number) => {
    return votes * votes
  }

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey) return

    setLoading(true)
    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const dao = await (program.account as any).dao.fetch(daoPda)
      const governanceMint = dao.governanceMint

      const voterAta = getAssociatedTokenAddressSync(
        governanceMint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      const [whitelistPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("whitelist"),
          daoPda.toBuffer(),
          publicKey.toBuffer()
        ],
        program.programId
      )

      const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          proposalPda.toBuffer(),
          publicKey.toBuffer()
        ],
        program.programId
      )

      const tx = await program.methods
        .vote(new anchor.BN(voteAmount), support)
        .accounts({
          proposal: proposalPda,
          dao: daoPda,
          whitelistRecord: whitelistPda,
          voteRecord: voteRecordPda,
          governanceMint: governanceMint,
          voterTokenAccount: voterAta,
          voter: publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      showToast('Vote submitted successfully!', 'success', tx)
      onVoted()
    } catch (err: any) {
      console.error('Error voting:', err)
      let errorMsg = 'Failed to submit vote'

      if (err.message?.includes('already in use') || err.message?.includes('custom program error: 0x0')) {
        errorMsg = 'You have already voted on this proposal.'
      } else if (err.message?.includes('NotWhitelisted')) {
        errorMsg = 'You are not whitelisted to vote on this proposal.'
      } else if (err.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient tokens to cast this vote. Check your balance.'
      } else if (err.message) {
        errorMsg = err.message
      }

      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const votes = parseInt(voteAmount) || 0
  const tokenCost = calculateCost(votes)

  return (
    <form onSubmit={handleVote} style={{
      padding: '1.5rem',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px'
    }}>
      <h4 style={{ marginBottom: '1rem' }}>Cast Your Vote</h4>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Number of Votes
        </label>
        <input
          type="number"
          value={voteAmount}
          onChange={(e) => setVoteAmount(e.target.value)}
          min="1"
          max="1000"
          required
        />
      </div>

      <div style={{
        padding: '1rem',
        background: 'rgba(108, 92, 231, 0.1)',
        border: '1px solid rgba(108, 92, 231, 0.3)',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem', color: '#aaa' }}>
          Quadratic Cost
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6c5ce7' }}>
          {tokenCost} tokens
        </div>
        <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
          Formula: {votes}² = {tokenCost}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setSupport(true)}
          style={{
            flex: 1,
            background: support ? '#2ecc71' : 'rgba(46, 204, 113, 0.2)',
            borderColor: '#2ecc71'
          }}
        >
          Vote YES
        </button>
        <button
          type="button"
          onClick={() => setSupport(false)}
          style={{
            flex: 1,
            background: !support ? '#e74c3c' : 'rgba(231, 76, 60, 0.2)',
            borderColor: '#e74c3c'
          }}
        >
          Vote NO
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || votes === 0}
        style={{ width: '100%' }}
      >
        {loading ? 'Submitting...' : `Submit ${support ? 'YES' : 'NO'} Vote`}
      </button>
    </form>
  )
}
