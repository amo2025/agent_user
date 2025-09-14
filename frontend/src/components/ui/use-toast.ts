import { useState } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...props, id }
    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, props.duration || 5000)
  }

  return { toast, toasts }
}