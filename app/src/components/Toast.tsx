import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  txHash?: string
  onClose: () => void
}

export default function Toast({ message, type, txHash, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 8000)

    return () => clearTimeout(timer)
  }, [onClose])

  const explorerUrl = txHash ? `https://explorer.solana.com/tx/${txHash}?cluster=devnet` : null
  const shortTxHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : null

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      maxWidth: '400px',
      background: type === 'success' ? 'rgba(46, 204, 113, 0.95)' : 'rgba(231, 76, 60, 0.95)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {type === 'success' ? 'Success!' : 'Error'}
          </div>
          <div style={{ fontSize: '0.9rem', marginBottom: txHash ? '0.5rem' : '0' }}>
            {message}
          </div>
          {txHash && explorerUrl && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                opacity: 0.9,
                marginBottom: '0.5rem',
                wordBreak: 'break-all'
              }}>
                {shortTxHash}
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'white',
                  textDecoration: 'underline',
                  fontSize: '0.85rem',
                  display: 'inline-block'
                }}
              >
                View on Explorer →
              </a>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1',
            minWidth: 'auto'
          }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
