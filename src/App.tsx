// Mapa de pantallas de la app (qué se muestra en cada dirección)
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import RestTimer from './components/RestTimer'
import Home from './pages/Home'
import Routines from './pages/Routines'
import RoutineDetail from './pages/RoutineDetail'
import ImportRoutine from './pages/ImportRoutine'
import EditRoutine from './pages/EditRoutine'
import Workout from './pages/Workout'
import Settings from './pages/Settings'
import Fasting from './pages/Fasting'
import FastWatcher from './components/FastWatcher'
import { closeStaleSessions } from './lib/sessions'

export default function App() {
  // Al abrir la app, cerrar entrenamientos que quedaron abiertos de otro día
  useEffect(() => {
    void closeStaleSessions()
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rutinas" element={<Routines />} />
        <Route path="/rutinas/nueva" element={<ImportRoutine />} />
        <Route path="/rutinas/:id" element={<RoutineDetail />} />
        <Route path="/rutinas/:id/editar" element={<EditRoutine />} />
        <Route path="/rutinas/:id/dia/:dayId" element={<Workout />} />
        <Route path="/ayuno" element={<Fasting />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <RestTimer />
      <FastWatcher />
      <BottomNav />
    </div>
  )
}
