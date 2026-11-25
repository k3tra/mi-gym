// Notificaciones del sistema (la que aparece arriba en el celular).
// Solo funcionan con HTTPS (cuando la app esté publicada, Etapa 4) y si diste permiso.

export function canNotify(): boolean {
  return typeof Notification !== 'undefined' && window.isSecureContext
}

export async function askNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canNotify()) return 'unsupported'
  return Notification.requestPermission()
}

export async function notify(title: string, body: string): Promise<void> {
  if (!canNotify() || Notification.permission !== 'granted') return
  try {
    // En Android hay que mostrarla a través del service worker (Etapa 4)
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body, icon: 'pwa-192x192.png', tag: 'gym' })
      return
    }
    new Notification(title, { body })
  } catch {
    // Algunos navegadores no la permiten: el aviso con sonido igual funciona
  }
}
