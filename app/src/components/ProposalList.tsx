import { useState, useEffect } from 'react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import ProposalCard from './ProposalCard'
import * as anchor from '@coral-xyz/anchor'

export default function ProposalList() {
  const program = useAnchorProgram()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProposals()
  }, [program])

  const loadProposals = async () => {
    if (!program) return

    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      try {
        await (program.account as any).dao.fetch(daoPda)
      } catch {
        setLoading(false)
        return
      }

      const proposalAccounts = await (program.account as any).proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: daoPda.toBase58(),
          }
        }
      ])

      const proposalsWithKeys = proposalAccounts
        .map((p: any) => ({
          publicKey: p.publicKey,
          ...p.account
        }))
        .sort((a: any, b: any) => b.proposalId.toNumber() - a.proposalId.toNumber())

      setProposals(proposalsWithKeys)
    } catch (err) {
      console.error('Error loading proposals:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        Loading proposals...
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        <h3 style={{ marginBottom: '0.5rem' }}>No Proposals Yet</h3>
        <p style={{ color: '#aaa' }}>
          Create the first proposal to get started!
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
        Proposals ({proposals.length})
      </h2>
      <div style={{
        display: 'grid',
        gap: '1.5rem'
      }}>
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.publicKey.toString()}
            proposal={proposal}
            onVoted={loadProposals}
          />
        ))}
      </div>
    </div>
  )
}
