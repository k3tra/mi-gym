# CLAUDE.md — Mi Gym (PWA de entrenamiento)

App web para el celular, instalable como PWA, **sin backend**. Sirve para cargar la rutina mensual del gimnasio (PDF), entrenar marcando series y pesos, y llevar el temporizador de descanso y el de ayuno.

## Sobre el usuario
- Es principiante programando. Explicale cada paso en forma breve, en **español rioplatense** (vos), y siempre decile qué comando correr.
- Se trabaja **por etapas**: al terminar cada una, explicá cómo probarla en el celular y esperá su OK antes de seguir.
- Toda la interfaz de la app va en español.

## Comandos
```bash
npm install            # instalar dependencias (una vez)
npm run dev -- --host  # servidor de desarrollo; desde el celular: http://IP-de-la-PC:5173
npm test               # pruebas (Vitest) del parser
npm run build          # chequeo de tipos + build de producción en dist/
```

## Stack
React 19 + Vite + TypeScript + Tailwind v4 (`@tailwindcss/vite`), react-router (HashRouter), Dexie (IndexedDB) + `dexie-react-hooks`, pdfjs-dist (build `legacy`, para que funcione en celulares más viejos).

## Estructura
- `src/types.ts`: todos los tipos (Routine, Day, Exercise, SetScheme, Session, SetLog, Fast).
- `src/db/db.ts`: base de datos Dexie. **Si cambiás los índices, subí el número de `version()`.**
- `src/parser/`: texto → rutina.
  - `parseRoutineText.ts` es el corazón.
  - `parseScheme.ts` lee "4x10", "2x15/4x12" y "3x45s".
  - `pdfToText.ts` saca el texto de un PDF con pdf.js.
- `src/lib/`: lógica pura.
  - `week.ts`: semana actual y fechas.
  - `nextDay.ts`: qué día toca.
  - `draft.ts`: borrador editable de la vista previa.
  - `text.ts`: normalizar nombres.
  - `id.ts`: generar ids.
- `src/components/`: UI reutilizable (`ui.tsx`, `RoutineEditor.tsx`, `DayList.tsx`, `BottomNav.tsx`).
- `src/pages/`: una pantalla por archivo.

## Reglas importantes
- **El parser es genérico.** Nunca dependas de nombres de ejercicios concretos: solo de patrones (`DIA n:`, `SEMANA n`, `NxM`, fechas `dd/mm/aaaa`). Tiene que funcionar con cualquier cantidad de días y ejercicios.
- **Formato de las rutinas del gimnasio:**
  - Encabezado: `NUMERO DE RUTINA`, `FECHA DE INICIO` y `RUTINA VALIDA HASTA EL`. El nombre del archivo sirve de respaldo.
  - Días: `DIA n: GRUPOS SEMANA 1..4`.
  - Los nombres largos ocupan 2 líneas; el esquema viene en una línea aparte.
  - `2x15/4x12` = aproximación + series efectivas.
  - Si una semana no tiene esquema, se repite la anterior.
  - Entre páginas, pdfToText mete `PAGE_BREAK`, y el parser descarta lo que quedó suelto (datos personales).
- **Las rutinas viejas no se borran:** pasan a `status: 'archived'`. Solo hay una `active`.
- **Fechas:** se guardan como `"AAAA-MM-DD"` y se parsean como fecha local con `parseISODate` (nunca con `new Date("AAAA-MM-DD")`, que usa UTC).
- **Temporizadores:** guardar timestamps (`endsAt`, `startAt`) y calcular contra `Date.now()`. Nunca un contador en memoria, porque tiene que sobrevivir a cerrar la app o apagar la pantalla.
- **No usar `crypto.randomUUID`:** no anda por `http://IP` desde el celular. Usá `newId()` de `src/lib/id.ts`.
- **`useLiveQuery` devuelve `undefined` mientras carga.** Para "no existe", devolvé `null` (`?? null`).
- **Estilos:**
  - Mobile-first y modo oscuro siempre: fondo `zinc-950`, acento `lime-400`.
  - Botones grandes (mínimo `min-h-11`; los principales con `big`).
  - Las clases propias de CSS van en `@layer components`.
- **Privacidad:** los PDF del usuario tienen datos personales.
  - Están en `.gitignore` y no se suben a ningún lado.
  - Las pruebas usan solo un fragmento sin datos personales; la prueba con el PDF real se saltea si no hay PDF en la carpeta.
- **API de Claude:** solo se llama si el usuario cargó su propia clave en Ajustes y toca "Mejorar con IA". Nunca llames a servicios externos por tu cuenta.

## Etapas
1. ✅ Parser (texto + PDF), vista previa editable, días y ejercicios, historial de rutinas.
2. ✅ Marcar series, peso por serie, "La última vez: X kg", progreso del día, temporizador de descanso, ajustes, backup JSON.
3. ✅ Temporizador de ayuno con historial (FastWatcher en App avisa al cumplir; `notifiedAt` evita avisar dos veces).
4. ✅ OCR de fotos (Tesseract.js, `fixOcrText` + `seriesOnFirstLine`), PWA (vite-plugin-pwa, autoUpdate, offline), "Mejorar con IA" opcional (`src/parser/claudeParser.ts`, clave del usuario en localStorage, `claude-opus-5-5`), deploy a GitHub Pages con `.github/workflows/deploy.yml` (BASE_PATH=/repo/).

## Publicación
- GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`): en cada push a `main` corre `npm test` + `npm run build` con `BASE_PATH=/<repo>/`.
- Para probar localmente la ruta de Pages en Git Bash: `MSYS_NO_PATHCONV=1 BASE_PATH=/mi-gym/ npm run build`. Sin `MSYS_NO_PATHCONV`, Git Bash convierte `/mi-gym/` en `C:/Program Files/Git/mi-gym/`.
- Íconos: `public/icon.svg` → `npx pwa-assets-generator` (config en `pwa-assets.config.ts`).
