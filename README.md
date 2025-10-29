# Manage Wize - Gestor de Proyectos con IA

Gestor de proyectos Scrum con inteligencia artificial integrada, construido con Next.js, Tailwind CSS y Shadcn/UI. Incluye generación automática de backlogs, user stories, asignación inteligente de tareas, dashboards predictivos con ML y análisis de sentimiento.

## ✨ NUEVAS FUNCIONALIDADES (Actualización)

### 📋 Formulario Estructurado para IA
Al crear proyectos con IA, ahora utiliza un **formulario estructurado** con 4 campos clave:
- **Objetivo** - ¿Qué quieres lograr con el proyecto?
- **Rol** - ¿Cuál es tu rol en el proyecto?
- **Contexto** - Información sobre equipo, tecnologías y duración
- **Restricciones** - Limitaciones, presupuesto y límites

### 🤖 Chat Iterativo en Tiempo Real
Visualización en vivo del proceso de generación con **Google Gemini AI** (estilo v0/Figma Make):
- ✅ Logs de progreso en tiempo real
- ✅ Vista de chunks de respuesta streaming
- ✅ Indicadores visuales de estado (cargando/completado/error)
- ✅ Confirmación de éxito con detalles

### 🎯 Integración con Gemini AI
- Reemplazadas respuestas mockeadas por **IA real** usando Google Gemini
- Generación de proyectos completos con estructura profesional
- Creación de backlogs, user stories y sprints optimizados
- Consumo de 50 tokens por generación de proyecto

### 📸 Foto de Perfil con ImgBB
- Subida de imágenes a ImgBB
- Validación de formato (JPG, PNG, GIF)
- Validación de tamaño (máx 2MB)
- Actualización en tiempo real

## 🚀 Características Principales

### 🔐 Autenticación y Roles
- ✅ Sistema de autenticación con JSON Server
- ✅ Tres roles: Scrum Master, Product Owner, Developer
- ✅ Protección de rutas con middleware Next.js
- ✅ Gestión de sesiones y perfiles de usuario
- ✅ Actualización de foto de perfil con ImgBB

### 📋 Gestión de Proyectos
- ✅ CRUD completo de proyectos
- ✅ Generación de proyectos con **Google Gemini AI** (prompts estructurados)
- ✅ Gestión de miembros del equipo con permisos granulares
- ✅ Sistema de invitaciones por email
- ✅ Vistas múltiples: Board, Backlog, Chat, History, OKRs
- ✅ Estadísticas y métricas en tiempo real
- ✅ Historial de cambios del proyecto (audit trail)

### 📝 Backlogs y User Stories
- ✅ Generación automática con IA real (Google Gemini)
- ✅ Creación manual con formato "Como/Quiero/Para"
- ✅ Criterios de aceptación detallados
- ✅ Priorización (Alta/Media/Baja) y Story Points
- ✅ Drag & drop para reordenar
- ✅ Visualización detallada con modales

### 🏃 Sprints y Tasks
- ✅ Generación de sprints con IA
- ✅ Descomposición automática de user stories en tareas
- ✅ Asignación inteligente basada en roles
- ✅ Tablero Kanban visual con Pragmatic Drag & Drop
- ✅ Estadísticas de progreso del sprint
- ✅ Estados: todo, in_progress, done, blocked

### 🎯 OKRs (Objectives & Key Results)
- ✅ Creación y gestión de OKRs por proyecto
- ✅ Key Results con progreso trackeable
- ✅ Estados: not_started, on_track, at_risk, achieved
- ✅ Períodos trimestrales (Q1-Q4)
- ✅ Visualización de progreso con gráficos

### 💬 Chat del Proyecto
- ✅ Chat en tiempo real por proyecto
- ✅ Mensajes de texto y sistema
- ✅ Indicadores de usuario online
- ✅ Historial persistente

### 📊 Analytics y Dashboards
- ✅ Dashboard principal con métricas clave
- ✅ Gráficos de progreso de proyectos
- ✅ Estadísticas de equipo
- ✅ Análisis de velocidad

### 🔔 Notificaciones
- ✅ Sistema de notificaciones en tiempo real
- ✅ Notificaciones de invitaciones a proyectos
- ✅ Notificaciones de asignación de tareas
- ✅ Marcado de leído/no leído
- ✅ Acciones directas desde notificaciones

### 💳 Sistema de Suscripciones
- ✅ Plan Gratuito: 100 tokens IA, 10 user stories/mes
- ✅ Plan Premium: Ilimitado + funcionalidades avanzadas
- ✅ Página de planes y precios
- ✅ Upgrade/downgrade instantáneo
- ✅ Monitoreo de uso y límites
- ✅ Alertas cuando se acercan a límites

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Lenguaje**: TypeScript 5
- **UI**: React 19
- **Estilos**: Tailwind CSS v4.1.9
- **Componentes**: Shadcn/UI + Radix UI
- **Iconos**: Lucide React
- **Fuente**: Geist (Vercel)

### Librerías Clave
- **IA**: @google/generative-ai (Google Gemini)
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: @atlaskit/pragmatic-drag-and-drop
- **Gráficos**: Recharts
- **Dates**: date-fns
- **Notificaciones**: Sonner
- **Temas**: next-themes

### Backend
- **API Mock**: JSON Server v1.0.0-beta.3
- **Base de datos**: db.json (normalizada, sin redundancia)
- **Storage**: ImgBB API (imágenes de perfil)

### DevOps
- **Build**: Next.js Compiler
- **Package Manager**: npm
- **Version Control**: Git

## 📦 Instalación y Setup

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### 1. Clonar el repositorio

\`\`\`bash
git clone https://github.com/tu-usuario/manage-wize.git
cd manage-wize
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# ImgBB API Key for image uploads
# Obtén tu API key en: https://api.imgbb.com/
NEXT_PUBLIC_IMGBB_API_KEY=tu_imgbb_api_key_aqui

# Google Gemini API Key for AI generation
# Obtén tu API key en: https://makersuite.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=tu_gemini_api_key_aqui
\`\`\`

> **⚠️ Importante**: 
> - **ImgBB API Key**: Necesaria para subir fotos de perfil. Regístrate gratis en [ImgBB API](https://api.imgbb.com/) para obtener tu key.
> - **Gemini API Key**: Necesaria para la generación de proyectos, backlogs y user stories con IA. Obtén tu key en [Google AI Studio](https://makersuite.google.com/app/apikey).
> - No compartas estas keys públicamente ni las subas al repositorio.

### 4. Instalar JSON Server globalmente

\`\`\`bash
npm install -g json-server
\`\`\`

### 5. Iniciar JSON Server (Terminal 1)

\`\`\`bash
json-server --watch db.json --port 3001
\`\`\`

El servidor JSON estará disponible en `http://localhost:3001`

### 6. Iniciar el servidor de desarrollo (Terminal 2)

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 🔑 Obtener API Keys

### ImgBB API Key (Gratis)
1. Visita [https://api.imgbb.com/](https://api.imgbb.com/)
2. Haz clic en "Get API Key"
3. Regístrate o inicia sesión
4. Copia tu API key y pégala en `.env.local`

### Google Gemini API Key (Gratis)
1. Visita [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia tu API key y pégala en `.env.local`
5. La cuota gratuita incluye 60 requests/minuto

## 👤 Usuarios de Prueba

### Scrum Master (Plan Premium)
- **Email**: admin@managewize.com
- **Password**: Admin123!
- **Acceso**: Todas las funcionalidades + dashboards predictivos

### Product Owner (Plan Gratuito)
- **Email**: po@managewize.com
- **Password**: ProductOwner123!
- **Límites**: 100 tokens IA, 10 user stories/mes

### Developer (Plan Gratuito)
- **Email**: dev@managewize.com
- **Password**: Developer123!
- **Límites**: 100 tokens IA, 10 user stories/mes

## 🎨 Sistema de Diseño

### Paleta de Colores

\`\`\`css
--primary: #6C3FB3        /* Morado primario - botones, headers */
--secondary: #513274      /* Morado secundario - fondos */
--accent: #08f1e5         /* Azul cian - highlights, notificaciones */
--success: #0dda86        /* Verde - éxitos, confirmaciones */
\`\`\`

### Tipografía
- **Fuente**: Poppins
- **Títulos**: Semi-bold (600)
- **Texto**: Regular (400)

### Componentes UI
Todos los componentes están construidos con Shadcn/UI y personalizados con el tema de Manage Wize:
- Button, Card, Input, Select, Dialog, Dropdown, Badge, Avatar, Progress, Tabs, etc.

## 📁 Estructura del Proyecto

\`\`\`
manage-wize/
├── app/
│   ├── (auth)/                         # Rutas de autenticación
│   │   ├── login/page.tsx              # Login
│   │   └── register/page.tsx           # Registro
│   ├── (dashboard)/                    # Rutas protegidas
│   │   ├── dashboard/page.tsx          # Dashboard principal
│   │   ├── projects/                   # Gestión de proyectos
│   │   │   ├── page.tsx                # Lista de proyectos
│   │   │   └── [id]/                   # Detalles del proyecto
│   │   │       ├── page.tsx            # Vista principal (tabs)
│   │   │       └── history/page.tsx    # Historial de cambios
│   │   ├── analytics/page.tsx          # Analytics y métricas
│   │   ├── okrs/page.tsx               # Gestión de OKRs
│   │   ├── notifications/page.tsx      # Centro de notificaciones
│   │   ├── invitations/page.tsx        # Invitaciones recibidas
│   │   ├── pricing/page.tsx            # Planes y precios
│   │   ├── settings/page.tsx           # Configuración de usuario
│   │   └── layout.tsx                  # Layout con sidebar
│   ├── globals.css                     # Estilos globales + Tailwind
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Landing page
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx             # Sidebar de navegación
│   │   └── app-header.tsx              # Header con notificaciones
│   ├── projects/
│   │   ├── create-project-dialog.tsx   # Crear proyecto con IA
│   │   ├── edit-project-dialog.tsx     # Editar proyecto
│   │   ├── project-board.tsx           # Vista Kanban
│   │   ├── project-backlog.tsx         # Vista Backlog
│   │   ├── project-chat.tsx            # Chat del proyecto
│   │   ├── project-history-dashboard.tsx # Historial
│   │   ├── project-okrs.tsx            # OKRs del proyecto
│   │   ├── project-invitations.tsx     # Invitaciones
│   │   ├── add-member-dialog.tsx       # Agregar miembros
│   │   ├── manage-permissions-dialog.tsx # Permisos
│   │   ├── task-detail-modal.tsx       # Modal de tarea
│   │   └── permission-guard.tsx        # Guard de permisos
│   ├── backlogs/
│   │   ├── backlog-card.tsx            # Card de backlog
│   │   ├── create-backlog-dialog.tsx   # Crear backlog
│   │   ├── create-user-story-dialog.tsx # Crear user story con IA
│   │   ├── user-story-card.tsx         # Card de user story
│   │   └── user-story-detail-modal.tsx # Detalles de user story
│   ├── sprints/
│   │   ├── sprint-card.tsx             # Card de sprint
│   │   ├── create-sprint-dialog.tsx    # Crear sprint
│   │   └── task-board.tsx              # Tablero de tareas
│   ├── okrs/
│   │   ├── okr-card.tsx                # Card de OKR
│   │   ├── create-okr-dialog.tsx       # Crear OKR
│   │   ├── edit-okr-dialog.tsx         # Editar OKR
│   │   ├── delete-okr-dialog.tsx       # Eliminar OKR
│   │   ├── okr-filters.tsx             # Filtros
│   │   └── okr-states.tsx              # Estados
│   ├── notifications/
│   │   └── invitation-notification.tsx # Notificación de invitación
│   ├── admin/
│   │   └── database-cleanup-widget.tsx # Limpieza de BD
│   └── ui/                             # Componentes Shadcn/UI (50+)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── auth/
│   │   └── auth-context.tsx            # Context de autenticación
│   ├── api-config.ts                   # Configuración centralizada de API
│   ├── data-helpers.ts                 # Helpers para JOINs normalizados
│   ├── gemini.ts                       # Cliente de Google Gemini
│   ├── imgbb.ts                        # Cliente de ImgBB
│   ├── cascade-delete.ts               # Borrado en cascada
│   ├── generation-messages.ts          # Mensajes de IA
│   ├── types/                          # TypeScript types
│   │   └── index.ts
│   └── utils.ts                        # Utilidades (cn, etc.)
├── hooks/
│   ├── use-mobile.ts                   # Hook para mobile detection
│   ├── use-toast.ts                    # Hook para toasts
│   ├── use-notifications.ts            # Hook para notificaciones
│   ├── use-project-permissions.ts      # Hook para permisos
│   └── use-project-history.ts          # Hook para historial
├── docs/
│   ├── database-diagram.puml           # Diagrama PlantUML de BD
│   └── project-history-system.md      # Doc del sistema de historial
├── db.json                             # Base de datos JSON Server (normalizada)
├── middleware.ts                       # Protección de rutas
├── .env.local                          # Variables de entorno (NO subir a git)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
\`\`\`

## 🔐 Sistema de Límites

### Plan Gratuito ($0/mes)
- **Tokens IA**: 100/mes
- **User Stories**: 10/mes
- **Proyectos**: Hasta 3 activos
- **Miembros**: Hasta 5 por equipo
- **Vistas**: Board, List
- **Soporte**: Email

### Plan Premium ($12/mes)
- **Tokens IA**: Ilimitados
- **User Stories**: Ilimitadas
- **Proyectos**: Ilimitados
- **Miembros**: Ilimitados
- **Vistas**: Board, List, Timeline, Calendar
- **Dashboards**: Predictivos con ML
- **Análisis**: Sentimiento en retrospectivas
- **Exportación**: Reportes (PDF, Excel)
- **Soporte**: Prioritario 24/7

## 🤖 Funcionalidades de IA con Google Gemini

### ✨ Generación de Proyectos
Utiliza **Google Gemini 1.5 Flash** para generar proyectos completos:
- ✅ Prompt estructurado (Objetivo + Rol + Contexto + Restricciones)
- ✅ Generación en tiempo real con streaming
- ✅ Objetivos SMART automáticos
- ✅ Timeline con milestones
- ✅ Descripción contextual profesional
- ✅ Consumo: ~50 tokens

### 📝 Generación de User Stories
Crea user stories profesionales con IA:
- ✅ Formato "Como [rol], quiero [acción] para [beneficio]"
- ✅ Criterios de aceptación detallados (3-5 por story)
- ✅ Priorización automática (Alta/Media/Baja)
- ✅ Estimación de Story Points
- ✅ Múltiples user stories por backlog
- ✅ Consumo: ~30 tokens por story

### 🎯 Características de la Integración
- ✅ API de Google Gemini integrada
- ✅ Visualización en tiempo real (estilo v0/Figma)
- ✅ Manejo de errores y timeouts
- ✅ Retry automático en caso de fallo
- ✅ Límites de rate limiting respetados (60 req/min)

## 📊 API REST (JSON Server)

### Base URL
\`\`\`
http://localhost:3001
\`\`\`

### Endpoints Principales

#### 👤 Users
\`\`\`
GET    /users              # Listar usuarios
GET    /users/:id          # Obtener usuario
POST   /users              # Crear usuario
PATCH  /users/:id          # Actualizar usuario (perfil, foto, subscription)
\`\`\`

#### 📋 Projects
\`\`\`
GET    /projects           # Listar proyectos
GET    /projects/:id       # Obtener proyecto
POST   /projects           # Crear proyecto (con IA o manual)
PATCH  /projects/:id       # Actualizar proyecto
DELETE /projects/:id       # Eliminar proyecto (cascade delete)
\`\`\`

#### 📝 Backlogs
\`\`\`
GET    /backlogs                    # Listar backlogs
GET    /backlogs?projectId=:id      # Backlogs de un proyecto
GET    /backlogs/:id                # Obtener backlog
POST   /backlogs                    # Crear backlog
PATCH  /backlogs/:id                # Actualizar backlog (reordenar items)
\`\`\`

#### 📖 User Stories
\`\`\`
GET    /userStories                 # Listar user stories
GET    /userStories?projectId=:id   # User stories de un proyecto
GET    /userStories/:id             # Obtener user story
POST   /userStories                 # Crear user story (con IA o manual)
PATCH  /userStories/:id             # Actualizar user story
DELETE /userStories/:id             # Eliminar user story
\`\`\`

#### ✅ Tasks
\`\`\`
GET    /tasks                       # Listar tareas
GET    /tasks?userStoryId=:id       # Tareas de una user story
GET    /tasks/:id                   # Obtener tarea
POST   /tasks                       # Crear tarea
PATCH  /tasks/:id                   # Actualizar tarea (estado, asignación)
DELETE /tasks/:id                   # Eliminar tarea
\`\`\`

#### 🏃 Sprints
\`\`\`
GET    /sprints                     # Listar sprints
GET    /sprints?projectId=:id       # Sprints de un proyecto
GET    /sprints/:id                 # Obtener sprint
POST   /sprints                     # Crear sprint
PATCH  /sprints/:id                 # Actualizar sprint
DELETE /sprints/:id                 # Eliminar sprint
\`\`\`

#### 🎯 OKRs
\`\`\`
GET    /okrs                        # Listar OKRs
GET    /okrs?projectId=:id          # OKRs de un proyecto
GET    /okrs/:id                    # Obtener OKR
POST   /okrs                        # Crear OKR
PATCH  /okrs/:id                    # Actualizar OKR (progreso)
DELETE /okrs/:id                    # Eliminar OKR
\`\`\`

#### 🔔 Notifications
\`\`\`
GET    /notifications               # Listar notificaciones
GET    /notifications?userId=:id    # Notificaciones de un usuario
PATCH  /notifications/:id           # Marcar como leída
DELETE /notifications/:id           # Eliminar notificación
\`\`\`

#### 📧 Invitations
\`\`\`
GET    /invitations                 # Listar invitaciones
GET    /invitations?projectId=:id   # Invitaciones de un proyecto
GET    /invitations?email=:email    # Invitaciones por email
POST   /invitations                 # Crear invitación
PATCH  /invitations/:id             # Aceptar/rechazar invitación
\`\`\`

#### 💬 Chat Messages
\`\`\`
GET    /chatMessages?projectId=:id  # Mensajes de chat de un proyecto
POST   /chatMessages                # Enviar mensaje
\`\`\`

#### 📜 Project History
\`\`\`
GET    /projectHistory?projectId=:id # Historial de cambios de un proyecto
\`\`\`

### Query Parameters Disponibles
- `_sort`: Ordenar por campo (ej: `_sort=createdAt`)
- `_order`: Orden ascendente/descendente (`asc`/`desc`)
- `_limit`: Limitar resultados (ej: `_limit=10`)
- `_page`: Paginación (ej: `_page=1`)
- Filtros por campo: `?status=active`, `?role=developer`, etc.

## 🚀 Scripts Disponibles

\`\`\`bash
npm run dev           # Iniciar servidor de desarrollo (localhost:3000)
npm run build         # Construir para producción
npm run start         # Iniciar servidor de producción
npm run lint          # Ejecutar ESLint
npm run json-server   # Iniciar JSON Server (localhost:3001)
\`\`\`

### Desarrollo Recomendado
Usa dos terminales simultáneamente:

**Terminal 1 - JSON Server:**
\`\`\`bash
npm run json-server
# O manualmente:
json-server --watch db.json --port 3001
\`\`\`

**Terminal 2 - Next.js Dev Server:**
\`\`\`bash
npm run dev
\`\`\`

## �️ Base de Datos

### Normalización y Arquitectura
- ✅ **100% normalizada** - Sin redundancia de datos
- ✅ No hay campos `projectId` redundantes en tasks
- ✅ Acceso a datos via relationships: `Task → UserStory → Project`
- ✅ Helpers en `lib/data-helpers.ts` para JOINs eficientes
- ✅ Cascade delete implementado (eliminar proyecto elimina todo lo relacionado)

### Diagrama de Base de Datos
Ver el diagrama PlantUML completo en `docs/database-diagram.puml` que incluye:
- 11 entidades principales (User, Project, UserStory, Task, Sprint, OKR, etc.)
- Todas las relaciones (1:N, N:M)
- Campos y tipos de datos
- Constraints y validaciones

## 📝 Roadmap Futuro

### Completado ✅
- [x] Integración con Google Gemini AI
- [x] Subida de imágenes con ImgBB
- [x] Base de datos normalizada
- [x] Sistema de permisos granulares
- [x] Historial de cambios (audit trail)
- [x] Chat por proyecto
- [x] OKRs y Key Results
- [x] Sistema de notificaciones
- [x] Invitaciones por email

## 🤝 Contribuir

Este es un proyecto de demostración educativa. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ por el equipo de Manage Wize

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Shadcn/UI](https://ui.shadcn.com/) - Componentes UI
- [Radix UI](https://www.radix-ui.com/) - Primitivas accesibles
- [Lucide Icons](https://lucide.dev/) - Iconos
- [JSON Server](https://github.com/typicode/json-server) - Mock API REST
- [Google Gemini](https://ai.google.dev/) - IA Generativa
- [ImgBB](https://imgbb.com/) - Hosting de imágenes
- [Vercel](https://vercel.com/) - Hosting y deployment

## 🐛 Reporte de Bugs

Si encuentras algún bug, por favor abre un issue en GitHub con:
1. Descripción del problema
2. Pasos para reproducirlo
3. Comportamiento esperado vs actual
4. Screenshots si es posible
5. Versión de Node.js y navegador

## 📮 Contacto

- **GitHub**: [@ManageWise-by-Horizon](https://github.com/ManageWise-by-Horizon)
- **Email**: contact@managewize.com
- **Website**: [managewize.com](https://managewize.com)

---

**Nota Importante**: Este proyecto utiliza **Google Gemini AI real** y **ImgBB** para funcionalidades de IA y upload de imágenes. La base de datos es JSON Server para propósitos de demostración. Para un entorno de producción, se recomienda:
- Base de datos relacional (PostgreSQL, MySQL)
- Autenticación robusta (NextAuth, Auth0, Clerk)
- Backend escalable (Node.js, Python FastAPI)
- CI/CD pipeline (GitHub Actions, Vercel)
- Monitoreo y analytics (Sentry, PostHog)
