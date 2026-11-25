# Mi Gym 🏋️

App web para el celular para seguir tu rutina del gimnasio, con temporizador de descanso y de ayuno. Se instala como una app (PWA), funciona sin internet y todo se guarda en tu celular: no hace falta cuenta.

## Instalarla en el celular
1. Abrí la dirección de la app publicada en GitHub Pages (`https://TU-USUARIO.github.io/mi-gym/`).
2. Instalala:
   - **Android (Chrome):** menú ⋮ → **Instalar app** (o "Agregar a la pantalla principal").
   - **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
3. Abrila desde el ícono. Funciona sin internet. Cuando publicás una versión nueva, se actualiza sola la próxima vez que la abrís.

> Los datos se guardan en **ese** navegador o app instalada. Si cambiás de celular, usá **Ajustes → Copia de seguridad**.

## Cargar la rutina del mes
1. Andá a **Rutinas → Cargar nueva rutina**:
   - **Subir PDF o foto:** el PDF es lo más preciso. También podés elegir una o varias fotos (una por página).
   - **Sacar foto a la rutina:** abre la cámara. Conviene buena luz, sin sombras y la hoja derecha.
2. Revisá la vista previa:
   - Lo que aparece en **amarillo** parece raro (por ejemplo, `2x145`).
   - Podés corregir, agregar, borrar o reordenar ejercicios y días.
   - En "Ver / corregir el texto leído" podés arreglar el texto y volver a interpretarlo.
3. Tocá **Guardar como rutina activa**. La rutina anterior queda archivada en **Rutinas**: nunca se borra.

También podés pegar el texto. El formato libre se entiende así:
```
Día 1: Pecho
Press banca 4x10
Sentadilla 3 x 12 - 60kg
Plancha 3x45s
Remo 4x10 descanso 90s (agarre cerrado)
```
- `2x15/4x12` = 2 series de aproximación + 4 efectivas.
- Varias columnas (`4x10 5x10 6x10 4x10`) = una por semana.

### ✨ Mejorar con IA (opcional)
Si cargás una clave de la API de Claude en **Ajustes**, en la vista previa aparece **Mejorar con IA**. Sirve sobre todo para fotos difíciles.
- El texto (y la foto, si subiste una sola) se envía a Anthropic **solo cuando tocás el botón**.
- Usa el modelo `claude-opus-5-5` y tiene costo según tu cuenta.
- La clave queda guardada únicamente en tu celular.

## Entrenar
- **Hoy** muestra el día que te toca (el siguiente al último que terminaste) y la semana de la rutina.
- En cada serie podés anotar el peso (opcional) y tocar **Hecha**. El número gris en el campo es el peso sugerido: el de tu serie anterior o el de **la última vez** que hiciste ese ejercicio, aunque haya sido en otra rutina y con un nombre parecido.
- Al marcar una serie arranca el **descanso**: −15 s, +15 s, pausar, saltar o minimizar. Cuando termina, suena y vibra (se configura en **Ajustes**).
- Al final, tocá **Terminar entrenamiento**. Lo que hiciste queda en **Rutinas → (tu rutina) → Entrenamientos**.
- En **Ajustes → Copia de seguridad** descargá un backup de vez en cuando: los datos viven solo en tu celular.

## Ayuno
- En **Ayuno** elegí el tipo (12:12, 14:10, 16:8, 18:6, 20:4 u "Otro" con las horas que quieras) y tocá **Empezar ayuno**. Si ya habías empezado, usá "Ya empecé antes" para cargar la hora.
- Muestra el tiempo transcurrido, lo que falta, la hora de inicio y la de fin. La hora de inicio se puede corregir.
- Sigue contando aunque cierres la app o apagues el celular, porque guarda la hora de inicio.
- Cuando se cumple, suena, vibra y (si activaste las notificaciones) muestra una notificación, siempre que la app esté abierta o en segundo plano. Si estaba cerrada del todo, lo ves al abrirla.
- Abajo está el **historial** con los ayunos cumplidos (✅) y los cortados antes (⏹).

---

## Para programar (en la PC)

### Instalar (una sola vez)
1. Tener instalado [Node.js](https://nodejs.org) (versión 20 o más nueva).
2. En una terminal, dentro de esta carpeta:
   ```bash
   npm install
   ```

### Probar mientras programás
```bash
npm run dev -- --host
```
- **Local:** `http://localhost:5173`, para abrirla en la PC.
- **Network:** `http://192.168.x.x:5173`, para abrirla en el celular, conectado al mismo wifi. La primera vez Windows pregunta por el firewall: aceptá en "Redes privadas".
- Para apagarlo: `Ctrl + C`.

> Por `http://192.168…` la app **no** se puede instalar y no muestra notificaciones: eso necesita HTTPS (la versión publicada).

### Pruebas
```bash
npm test
```
Prueba el lector de rutinas (texto, OCR y fechas). Si hay un PDF de rutina en esta carpeta, también lo prueba con ese PDF. Los PDF nunca se suben a GitHub (están en `.gitignore`).

### Publicar una versión nueva
```bash
git add .
git commit -m "Describí el cambio"
git push
```
GitHub corre las pruebas, compila y publica sola (en la pestaña **Actions** del repo ves cómo va). En 1–2 minutos está online.

## Estado
- ✅ **Etapa 1:** cargar rutina (PDF o texto), vista previa editable, días, ejercicios por semana, historial.
- ✅ **Etapa 2:** marcar series, anotar pesos ("La última vez"), temporizador de descanso, ajustes y backup.
- ✅ **Etapa 3:** temporizador de ayuno con aviso e historial.
- ✅ **Etapa 4:** foto de la rutina (OCR), app instalable que funciona sin internet, IA opcional, publicación en GitHub Pages.
