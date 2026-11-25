// Punto de entrada: monta la app en el <div id="root"> de index.html
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter: las direcciones quedan como /#/rutinas, así funciona en cualquier hosting gratis */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
