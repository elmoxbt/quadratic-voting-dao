import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import { useToast } from '../contexts/ToastContext'
import VoteForm from './VoteForm'
import * as anchor from '@coral-xyz/anchor'

interface Props {
  proposal: any
  onVoted: () => void
}

export default function ProposalCard({ proposal, onVoted }: Props) {
  const { publicKey } = useWallet()
  const program = useAnchorProgram()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showVoteForm, setShowVoteForm] = useState(false)

  const getStateColor = (state: any) => {
    if ('active' in state) return '#3498db'
    if ('passed' in state) return '#2ecc71'
    if ('rejected' in state) return '#e74c3c'
    if ('executed' in state) return '#9b59b6'
    if ('quorumNotMet' in state) return '#95a5a6'
    return '#fff'
  }

  const getStateName = (state: any) => {
    if ('active' in state) return 'Active'
    if ('passed' in state) return 'Passed'
    if ('rejected' in state) return 'Rejected'
    if ('executed' in state) return 'Executed'
    if ('cancelled' in state) return 'Cancelled'
    if ('quorumNotMet' in state) return 'Quorum Not Met'
    return 'Unknown'
  }

  const handleTally = async () => {
    if (!program || !publicKey) return

    setLoading(true)
    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const tx = await program.methods
        .tallyProposal()
        .accounts({
          proposal: proposal.publicKey,
          dao: daoPda,
        })
        .rpc()

      showToast('Proposal tallied successfully!', 'success', tx)
      onVoted()
    } catch (err: any) {
      console.error('Error tallying proposal:', err)
      const errorMsg = err.message || 'Failed to tally proposal'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!program || !publicKey) return

    setLoading(true)
    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const tx = await program.methods
        .executeProposal()
        .accounts({
          proposal: proposal.publicKey,
          dao: daoPda,
          authority: publicKey,
        })
        .rpc()

      showToast('Proposal executed successfully!', 'success', tx)
      onVoted()
    } catch (err: any) {
      console.error('Error executing proposal:', err)
      const errorMsg = err.message || 'Failed to execute proposal'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const isActive = 'active' in proposal.state && now <= proposal.endTime.toNumber()
  const canTally = 'active' in proposal.state && now > proposal.endTime.toNumber()
  const canExecute = 'passed' in proposal.state

  const yesPercentage = proposal.totalVotesCast.toNumber() > 0
    ? (proposal.yesVotes.toNumber() / proposal.totalVotesCast.toNumber()) * 100
    : 0

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '1.5rem',
      border: `1px solid ${getStateColor(proposal.state)}33`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', flex: '1 1 200px' }}>{proposal.title}</h3>
        <span style={{
          padding: '0.3rem 0.8rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          background: getStateColor(proposal.state) + '22',
          color: getStateColor(proposal.state),
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start'
        }}>
          {getStateName(proposal.state)}
        </span>
      </div>

      <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        {proposal.description}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#aaa' }}>YES Votes</div>
          <div style={{ fontSize: '1.5rem', color: '#2ecc71', fontWeight: 'bold' }}>
            {proposal.yesVotes.toString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#aaa' }}>NO Votes</div>
          <div style={{ fontSize: '1.5rem', color: '#e74c3c', fontWeight: 'bold' }}>
            {proposal.noVotes.toString()}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <span>Total Votes: {proposal.totalVotesCast.toString()}</span>
          <span>{yesPercentage.toFixed(1)}% YES</span>
        </div>
        <div style={{
          height: '8px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${yesPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      <div style={{
        fontSize: '0.85rem',
        color: '#aaa',
        marginBottom: '1rem',
        padding: '0.8rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '6px'
      }}>
        <div>Ends: {new Date(proposal.endTime.toNumber() * 1000).toLocaleString()}</div>
        <div>Proposal ID: #{proposal.proposalId.toString()}</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {isActive && (
          <button
            onClick={() => setShowVoteForm(!showVoteForm)}
            style={{ flex: 1 }}
          >
            {showVoteForm ? 'Hide Vote Form' : 'Vote'}
          </button>
        )}
        {canTally && (
          <button onClick={handleTally} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Tallying...' : 'Tally Results'}
          </button>
        )}
        {canExecute && (
          <button onClick={handleExecute} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Executing...' : 'Execute'}
          </button>
        )}
      </div>

      {showVoteForm && isActive && (
        <div style={{ marginTop: '1rem' }}>
          <VoteForm
            proposalPda={proposal.publicKey}
            onVoted={() => {
              setShowVoteForm(false)
              onVoted()
            }}
          />
        </div>
      )}
    </div>
  )
}
