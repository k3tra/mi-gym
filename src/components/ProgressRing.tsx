// Círculo de progreso (0 a 1) con contenido en el medio
import type { ReactNode } from 'react'

export default function ProgressRing({
  progress,
  size = 280,
  stroke = 14,
  color = 'stroke-lime-400',
  children,
}: {
  progress: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(Math.max(progress, 0), 1)
  return (
    <div className="relative mx-auto" style={{ width: size, maxWidth: '100%', aspectRatio: '1' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-zinc-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          className={`${color} transition-[stroke-dashoffset] duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
