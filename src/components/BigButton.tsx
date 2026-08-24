import type { ReactNode } from 'react'

export default function BigButton({ children, onClick, variant = 'primary', disabled = false }: {
  children: ReactNode; onClick: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean
}) {
  const styles = variant === 'primary'
    ? 'bg-teal text-white shadow-lg active:scale-[.98]'
    : 'bg-white/70 text-teal border-2 border-teal/30'
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full min-h-14 rounded-2xl px-6 py-4 text-xl font-extrabold tracking-wide transition ${styles} ${disabled ? 'opacity-60' : ''}`}>
      {children}
    </button>
  )
}
