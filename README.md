# FamilyQuest

Gestión de tareas del hogar para toda la familia, con puntos, ranking, chat en tiempo real y una mascota virtual que refleja lo bien (o mal) que la familia se organiza.

Pensada para que la use cualquier miembro de la familia sin importar su edad o soltura con la tecnología: interfaz clara, botones grandes, y todo explicado dentro de la propia app.

## Índice

- [Qué hace](#qué-hace)
- [Capturas](#capturas)
- [Stack técnico](#stack-técnico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
  - [Requisitos](#requisitos)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
- [Variables de entorno](#variables-de-entorno)
- [Cómo funciona por dentro](#cómo-funciona-por-dentro)
- [Hoja de ruta](#hoja-de-ruta)

## Qué hace

Cada familia tiene su propio espacio privado, al que se accede creando una cuenta y uniéndose con un código de invitación. Dentro:

- **Tareas domésticas con puntos.** Un catálogo de más de 50 tareas predefinidas (limpieza, cocina, estudio, cuidado de mascotas...) que suman o restan puntos al completarlas. Se pueden añadir o borrar tareas propias en cualquier momento.
- **Ranking semanal.** Compite en equipo por ver quién suma más puntos — se reinicia automáticamente cada semana para que siempre haya una competición fresca.
- **Una mascota virtual compartida.** Su salud sube con las tareas positivas y baja con las negativas: es un termómetro visual de cómo va la familia. Se puede personalizar eligiendo entre 6 especies distintas y varios complementos (sombreros, gafas, accesorios), todo desbloqueable con monedas que la familia gana jugando.
- **Chat familiar en tiempo real**, con notificaciones locales al completar tareas y recordatorios periódicos.
- **Modo claro/oscuro y tamaño de letra ajustable**, pensado para que sea cómoda de leer para cualquier edad.
- **Gestión de familia**: ver miembros y sus puntos, compartir o copiar el código de invitación, salir de la familia cuando se quiera.

## Capturas

*(Pendiente — coloca aquí capturas reales tomadas desde el móvil con Expo Go.)*

Guarda las imágenes en `docs/screenshots/` con estos nombres y se mostrarán automáticamente:

| Archivo | Pantalla |
|---|---|
| `docs/screenshots/inicio.png` | Inicio (mascota + tareas) |
| `docs/screenshots/ranking.png` | Ranking |
| `docs/screenshots/chat.png` | Chat |
| `docs/screenshots/ajustes.png` | Ajustes |

```markdown
<img src="docs/screenshots/inicio.png" width="250" />
<img src="docs/screenshots/ranking.png" width="250" />
<img src="docs/screenshots/chat.png" width="250" />
<img src="docs/screenshots/ajustes.png" width="250" />
```

## Stack técnico

| | |
|---|---|
| **Frontend** | React Native + Expo (un único cliente para iOS, Android y web) |
| **Navegación** | React Navigation (pestañas + stack) |
| **Animaciones** | React Native Reanimated |
| **Backend** | Node.js + Express |
| **Base de datos** | SQLite (`better-sqlite3`) |
| **Autenticación** | JWT + bcrypt |
| **Tiempo real** | Socket.IO |
| **Notificaciones** | expo-notifications |

## Estructura del proyecto

```
app-familia/
├── backend/          API REST + WebSocket
│   ├── db.js         Esquema de la base de datos y migraciones
│   └── index.js      Rutas, autenticación, lógica de negocio
└── frontend/         App de React Native (Expo)
    ├── components/    Componentes reutilizables (mascota, tareas, chat...)
    ├── context/       Estado global: sesión y tema (React Context)
    ├── navigation/    Navegación por pestañas
    ├── screens/       Una pantalla = un archivo
    └── utils/         Notificaciones y utilidades
```

## Puesta en marcha

### Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- La app [Expo Go](https://expo.dev/go) instalada en tu móvil (o un emulador de iOS/Android)
- Backend y móvil conectados a la **misma red WiFi**

### 1. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en `backend/` con una clave secreta para firmar los tokens de sesión:

```
JWT_SECRET=escribe-aqui-cualquier-cadena-larga-y-aleatoria
```

Arranca el servidor:

```bash
node index.js
```

Deberías ver `Servidor escuchando en http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
npm install
```

Busca tu IP local (en Windows: `ipconfig`, en macOS/Linux: `ifconfig` o `ip a`) y actualízala en `frontend/constants/config.js`:

```js
export const URL_BASE = 'http://TU_IP_LOCAL:3000';
```

Arranca la app:

```bash
npx expo start
```

Escanea el código QR con la app **Expo Go** desde tu móvil (misma red WiFi que el backend).

## Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `JWT_SECRET` | `backend/.env` | Clave para firmar los tokens de sesión (JWT). Cualquier cadena larga y aleatoria sirve. |

## Cómo funciona por dentro

- **Sesión persistente**: el token JWT se guarda en el dispositivo (`AsyncStorage`), así que no hace falta iniciar sesión cada vez que se abre la app.
- **Tema dinámico**: colores y tipografía viven en un `Context` (`TemaContext`) en vez de estar fijados por pantalla, para poder cambiar de modo claro/oscuro y tamaño de letra en caliente.
- **Ranking semanal sin cron**: no hay ningún proceso en segundo plano — cada vez que se consulta la familia se comprueba si ya tocaba reiniciar el ranking (perezoso, pero suficiente para el tamaño de la app).
- **Notificaciones locales vs. push**: los recordatorios y el aviso al completar una tarea son notificaciones locales (no necesitan servidor). El aviso en tiempo real a otros miembros de la familia está preparado en el backend, pero requiere vincular el proyecto a EAS (Expo Application Services) para funcionar de verdad.

## Hoja de ruta

- [ ] Rol de administrador familiar (permisos sobre tareas y miembros)
- [ ] Historial de tareas completadas
- [ ] Notificaciones push reales entre miembros de la familia (requiere EAS)
- [ ] Onboarding para usuarios nuevos

---

Proyecto personal de aprendizaje, construido paso a paso.
