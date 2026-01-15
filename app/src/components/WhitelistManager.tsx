import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '../hooks/useAnchorProgram'
import { useToast } from '../contexts/ToastContext'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'

export default function WhitelistManager() {
  const { publicKey } = useWallet()
  const program = useAnchorProgram()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  const [isAuthority, setIsAuthority] = useState(false)

  useEffect(() => {
    checkAuthority()
  }, [publicKey, program])

  const checkAuthority = async () => {
    if (!program || !publicKey) return

    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const dao = await (program.account as any).dao.fetch(daoPda)
      setIsAuthority(dao.authority.toString() === publicKey.toString())
    } catch (err) {
      console.error('Error checking authority:', err)
    }
  }

  const handleAddToWhitelist = async () => {
    if (!program || !publicKey || !userAddress) return

    setLoading(true)
    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const user = new PublicKey(userAddress)

      const [whitelistPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("whitelist"), daoPda.toBuffer(), user.toBuffer()],
        program.programId
      )

      const tx = await program.methods
        .addToWhitelist(user)
        .accounts({
          dao: daoPda,
          whitelistRecord: whitelistPda,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      showToast('User added to whitelist successfully!', 'success', tx)
      setUserAddress('')
    } catch (err: any) {
      console.error('Error adding to whitelist:', err)
      const errorMsg = err.message || 'Failed to add user to whitelist'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWhitelist = async () => {
    if (!program || !publicKey || !userAddress) return

    setLoading(true)
    try {
      const daoName = "MainDAO"
      const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), Buffer.from(daoName)],
        program.programId
      )

      const user = new PublicKey(userAddress)

      const [whitelistPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("whitelist"), daoPda.toBuffer(), user.toBuffer()],
        program.programId
      )

      const tx = await program.methods
        .removeFromWhitelist()
        .accounts({
          dao: daoPda,
          whitelistRecord: whitelistPda,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      showToast('User removed from whitelist successfully!', 'success', tx)
      setUserAddress('')
    } catch (err: any) {
      console.error('Error removing from whitelist:', err)
      const errorMsg = err.message || 'Failed to remove user from whitelist'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!publicKey || !isAuthority) return null

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(155, 89, 182, 0.1)',
      border: '1px solid rgba(155, 89, 182, 0.3)',
      borderRadius: '12px',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Whitelist Management (Admin Only)</h3>
      <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Add or remove users from the voting whitelist
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          User Address
        </label>
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="Enter wallet address"
          style={{ marginBottom: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleAddToWhitelist}
          disabled={loading || !userAddress}
          style={{
            flex: '1 1 150px',
            background: '#9b59b6',
            borderColor: '#8e44ad'
          }}
        >
          {loading ? 'Processing...' : 'Add to Whitelist'}
        </button>
        <button
          onClick={handleRemoveFromWhitelist}
          disabled={loading || !userAddress}
          style={{
            flex: '1 1 150px',
            background: '#e74c3c',
            borderColor: '#c0392b'
          }}
        >
          {loading ? 'Processing...' : 'Remove from Whitelist'}
        </button>
      </div>
    </div>
  )
}
