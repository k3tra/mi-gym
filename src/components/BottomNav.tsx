// Barra de pestañas fija abajo (como en las apps nativas)
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Hoy', icon: '🏋️', end: true },
  { to: '/rutinas', label: 'Rutinas', icon: '📋', end: false },
  { to: '/ayuno', label: 'Ayuno', icon: '⏳', end: false },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️', end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${isActive ? 'text-lime-400' : 'text-zinc-400'}`
            }
          >
            <span className="text-xl leading-none" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
