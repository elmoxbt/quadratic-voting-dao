import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import idl from '../../../target/idl/solana_quadratic_voting_dao.json'

export function useAnchorProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey) return null

    const provider = new anchor.AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    )

    return new Program(idl as any, provider)
  }, [connection, wallet])
}
