import { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '../components/Toast'

interface ToastData {
  id: number
  message: string
  type: 'success' | 'error'
  txHash?: string
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error', txHash?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (message: string, type: 'success' | 'error', txHash?: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, txHash }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        zIndex: 9999
      }}>
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ transform: `translateY(-${index * 10}px)` }}>
            <Toast
              message={toast.message}
              type={toast.type}
              txHash={toast.txHash}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
