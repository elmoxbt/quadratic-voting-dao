import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import { useToast } from '../contexts/ToastContext'
import * as anchor from '@coral-xyz/anchor'

interface Props {
  onProposalCreated: () => void
}

export default function CreateProposalForm({ onProposalCreated }: Props) {
  const { publicKey } = useWallet()
  const program = useAnchorProgram()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [votingPeriodHours, setVotingPeriodHours] = useState('1')
  const [votingPeriodMinutes, setVotingPeriodMinutes] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey) return

    setLoading(true)
    setError('')

    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const daoAccount = await (program.account as any).dao.fetch(daoPda)

      const [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          daoPda.toBuffer(),
          daoAccount.proposalCount.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      )

      const hours = parseInt(votingPeriodHours) || 0
      const minutes = parseInt(votingPeriodMinutes) || 0
      const totalSeconds = (hours * 3600) + (minutes * 60)

      const tx = await program.methods
        .createProposal(title, description, new anchor.BN(totalSeconds))
        .accounts({
          dao: daoPda,
          proposal: proposalPda,
          proposer: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      showToast('Proposal created successfully!', 'success', tx)

      setTitle('')
      setDescription('')
      setVotingPeriodHours('1')
      setVotingPeriodMinutes('0')
      onProposalCreated()
    } catch (err: any) {
      console.error('Error creating proposal:', err)
      const errorMsg = err.message || 'Failed to create proposal'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '1.5rem'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Create Proposal</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter proposal title"
            maxLength={200}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal"
            rows={4}
            maxLength={1000}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Voting Period
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                value={votingPeriodHours}
                onChange={(e) => setVotingPeriodHours(e.target.value)}
                placeholder="Hours"
                min="0"
                max="168"
              />
              <small style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                Hours
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                value={votingPeriodMinutes}
                onChange={(e) => setVotingPeriodMinutes(e.target.value)}
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <small style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                Minutes
              </small>
            </div>
          </div>
          <small style={{ color: '#aaa', fontSize: '0.8rem' }}>
            Total: {parseInt(votingPeriodHours) || 0}h {parseInt(votingPeriodMinutes) || 0}m
          </small>
        </div>

        {error && (
          <div style={{
            padding: '0.8rem',
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating...' : 'Create Proposal'}
        </button>
      </form>
    </div>
  )
}
