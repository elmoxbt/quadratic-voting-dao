import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import { useToast } from '../contexts/ToastContext'
import * as anchor from '@coral-xyz/anchor'
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

export default function MintTokensButton() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const program = useAnchorProgram()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [canMint, setCanMint] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkMintEligibility()
    const interval = setInterval(() => {
      checkMintEligibility()
    }, 3000)
    return () => clearInterval(interval)
  }, [publicKey, program])

  const checkMintEligibility = async () => {
    if (!program || !publicKey) return

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

      // Check balance
      let balanceAmount = 0
      try {
        const tokenAccount = await connection.getTokenAccountBalance(voterAta)
        balanceAmount = parseFloat(tokenAccount.value.uiAmount?.toString() || '0')
        setBalance(balanceAmount)
      } catch {
        setBalance(0)
      }

      // Check mint record for cooldown
      const [mintRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint_record"), publicKey.toBuffer()],
        program.programId
      )

      let canMintNow = balanceAmount < 50
      let cooldownActive = false
      let cooldownMessage = ''

      try {
        const mintRecord = await (program.account as any).mintRecord.fetch(mintRecordPda)
        const lastMintTime = mintRecord.lastMintTime.toNumber()
        const now = Math.floor(Date.now() / 1000)
        const timeSinceLastMint = now - lastMintTime
        const cooldownPeriod = 24 * 60 * 60 // 24 hours in seconds

        if (timeSinceLastMint < cooldownPeriod) {
          cooldownActive = true
          canMintNow = false
          const timeRemaining = cooldownPeriod - timeSinceLastMint
          const hoursRemaining = Math.floor(timeRemaining / 3600)
          const minutesRemaining = Math.floor((timeRemaining % 3600) / 60)
          const timeString = `${hoursRemaining}h ${minutesRemaining}m`
          cooldownMessage = `Must wait ${timeString} before minting again`
        }
      } catch {
        // No mint record exists yet, user can mint
      }

      setCanMint(canMintNow)

      // Set error messages
      if (balanceAmount >= 100) {
        setErrorMessage('Maximum balance of 100 tokens reached')
      } else if (balanceAmount >= 50) {
        setErrorMessage('Balance must be below 50 tokens to mint')
      } else if (cooldownActive) {
        setErrorMessage(cooldownMessage)
      } else {
        setErrorMessage('')
      }
    } catch (err) {
      console.error('Error checking mint eligibility:', err)
    }
  }

  const handleMint = async () => {
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

      const [mintRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint_record"), publicKey.toBuffer()],
        program.programId
      )

      const tx = await program.methods
        .mintGovernanceTokens()
        .accounts({
          dao: daoPda,
          governanceMint: governanceMint,
          recipientTokenAccount: voterAta,
          mintRecord: mintRecordPda,
          recipient: publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      showToast('Minted 100 tokens successfully!', 'success', tx)
      await checkMintEligibility()
    } catch (err: any) {
      console.error('Error minting tokens:', err)
      let errorMsg = 'Failed to mint tokens'

      if (err.message?.includes('BalanceTooHigh')) {
        errorMsg = 'Balance too high to mint (must be below 50 tokens)'
      } else if (err.message?.includes('MintCapReached')) {
        errorMsg = 'Cannot exceed maximum balance of 100 tokens'
      } else if (err.message?.includes('MintCooldownActive')) {
        errorMsg = 'Must wait 24 hours between mints'
      } else if (err.message) {
        errorMsg = err.message
      }

      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!publicKey) return null

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(46, 204, 113, 0.1)',
      border: '1px solid rgba(46, 204, 113, 0.3)',
      borderRadius: '12px',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Governance Tokens</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
            {balance !== null ? (
              <>
                Balance: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{balance.toFixed(2)}</span> tokens
              </>
            ) : (
              'Loading balance...'
            )}
          </p>
          {errorMessage && (
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {errorMessage}
            </p>
          )}
        </div>
        <button
          onClick={handleMint}
          disabled={loading || !canMint}
          style={{
            background: canMint ? '#2ecc71' : 'rgba(149, 165, 166, 0.3)',
            borderColor: canMint ? '#27ae60' : '#95a5a6',
            minWidth: '150px',
            flex: '0 1 auto'
          }}
        >
          {loading ? 'Minting...' : 'Mint 100 Tokens'}
        </button>
      </div>
    </div>
  )
}
