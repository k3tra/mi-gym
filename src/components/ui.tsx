// Piezas visuales reutilizables: botones, tarjetas, títulos
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-lime-400 text-zinc-950 active:bg-lime-300',
  secondary: 'bg-zinc-800 text-zinc-100 active:bg-zinc-700',
  danger: 'bg-red-500/15 text-red-300 active:bg-red-500/25',
  ghost: 'text-zinc-300 active:bg-zinc-800',
}

export function Button({
  variant = 'secondary',
  big = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; big?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-2xl font-semibold transition disabled:opacity-40 ${big ? 'min-h-14 px-5 text-lg' : 'min-h-11 px-4'} ${variants[variant]} ${className}`}
    />
  )
}

export function LinkButton({
  to,
  variant = 'secondary',
  big = false,
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  big?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-center rounded-2xl font-semibold transition ${big ? 'min-h-14 px-5 text-lg' : 'min-h-11 px-4'} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-4 ${className}`}>{children}</div>
}

export function PageTitle({ children, back }: { children: ReactNode; back?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {back && (
        <Link to={back} className="-ml-2 rounded-xl px-2 py-1 text-2xl text-zinc-400" aria-label="Volver">
          ‹
        </Link>
      )}
      <h1 className="text-2xl font-bold">{children}</h1>
    </div>
  )
}
