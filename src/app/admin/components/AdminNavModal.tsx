'use client'

import { useRouter } from 'next/navigation'
import Modal from '../../components/Modal'

export default function AdminNavModal({
  children,
  variant = 'wide',
}: {
  children: React.ReactNode
  variant?: 'default' | 'wide' | 'tall'
}) {
  const router = useRouter()

  return (
    <Modal isOpen onCloseAction={() => router.back()} variant={variant}>
      {children}
    </Modal>
  )
}
