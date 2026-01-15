import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import Dashboard from './components/Dashboard'
import { ToastProvider } from './contexts/ToastContext'
import '@solana/wallet-adapter-react-ui/styles.css'

function App() {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ToastProvider>
            <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
              <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ flex: '1 1 250px' }}>
                  <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    Quadratic DAO
                  </h1>
                  <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                    Fair governance through quadratic voting
                  </p>
                </div>
                <WalletMultiButton />
              </header>
              <Dashboard />
            </div>
          </ToastProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
