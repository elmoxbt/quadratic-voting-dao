import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateProposalForm from './CreateProposalForm'
import ProposalList from './ProposalList'
import MintTokensButton from './MintTokensButton'
import WhitelistManager from './WhitelistManager'

export default function Dashboard() {
  const { connected } = useWallet()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleProposalCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (!connected) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Connect Your Wallet
        </h2>
        <p style={{ color: '#aaa' }}>
          Please connect your wallet to interact with the Quadratic Voting DAO
        </p>
      </div>
    )
  }

  return (
    <div>
      <MintTokensButton />
      <WhitelistManager />
      <div style={{ marginBottom: '2rem' }}>
        <CreateProposalForm onProposalCreated={handleProposalCreated} />
      </div>

      <ProposalList key={refreshTrigger} />
    </div>
  )
}
