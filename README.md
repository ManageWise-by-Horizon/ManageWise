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

### Autenticación y Roles
- ✅ Sistema de autenticación mockeado con localStorage
- ✅ Tres roles: Scrum Master, Product Owner, Developer
- ✅ Protección de rutas con middleware
- ✅ Gestión de sesiones y perfiles de usuario

### Gestión de Proyectos
- ✅ CRUD completo de proyectos
- ✅ Generación de proyectos con IA (objetivos SMART automáticos)
- ✅ Gestión de miembros del equipo
- ✅ Múltiples vistas: Summary, Board, List, Timeline, Calendar
- ✅ Estadísticas y métricas por proyecto

### Backlogs y User Stories
- ✅ Generación automática de backlogs con IA
- ✅ Creación de user stories con formato "Como/Quiero/Para"
- ✅ Criterios de aceptación detallados
- ✅ Métricas BLEU/ROUGE simuladas (>85% calidad)
- ✅ Priorización (Alta/Media/Baja) y Story Points
- ✅ Organización por Epics

### Sprints y Tasks
- ✅ Generación de sprints con IA
- ✅ Descomposición automática de user stories en tareas
- ✅ Asignación inteligente basada en roles y habilidades
- ✅ Tablero Kanban visual (Por Hacer, En Progreso, Completado)
- ✅ Estadísticas de progreso del sprint

### Asistente IA
- ✅ Chatbot conversacional especializado en Scrum
- ✅ Respuestas contextuales sobre metodologías ágiles
- ✅ Generación de contenido (backlogs, user stories, criterios)
- ✅ Prompts sugeridos para consultas comunes
- ✅ Historial de conversaciones

### Dashboards Predictivos (Premium)
- ✅ Métricas predictivas con Machine Learning simulado
- ✅ Predicción de completitud de sprints
- ✅ Análisis de velocidad del equipo
- ✅ Nivel de riesgo y recomendaciones
- ✅ Análisis de sentimiento en retrospectivas
- ✅ Performance individual del equipo
- ✅ Burndown charts y velocity trends

### Sistema de Suscripciones
- ✅ Plan Gratuito: 100 tokens IA, 10 user stories/mes
- ✅ Plan Premium: Ilimitado + dashboards predictivos
- ✅ Página de planes y precios
- ✅ Upgrade/downgrade instantáneo
- ✅ Monitoreo de uso y límites
- ✅ Notificaciones cuando se acercan a límites

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes**: Shadcn/UI (Radix UI)
- **API Mock**: JSON Server
- **Fuente**: Poppins (Google Fonts)
- **Iconos**: Lucide React

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

### 3. Instalar JSON Server globalmente

\`\`\`bash
npm install -g json-server
\`\`\`

### 4. Iniciar JSON Server (Terminal 1)

\`\`\`bash
json-server --watch db.json --port 3001
\`\`\`

El servidor JSON estará disponible en `http://localhost:3001`

### 5. Iniciar el servidor de desarrollo (Terminal 2)

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

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
│   ├── (auth)/                    # Rutas de autenticación
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Rutas protegidas
│   │   ├── dashboard/page.tsx     # Dashboard principal
│   │   ├── projects/              # Gestión de proyectos
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── backlogs/              # Backlogs y user stories
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── sprints/               # Sprints y tasks
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── ai-assistant/page.tsx  # Chatbot IA
│   │   ├── analytics/page.tsx     # Dashboards predictivos
│   │   ├── pricing/page.tsx       # Planes y precios
│   │   ├── settings/page.tsx      # Configuración
│   │   └── layout.tsx             # Layout con sidebar
│   ├── globals.css                # Estilos globales + Tailwind
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx        # Sidebar de navegación
│   │   └── app-header.tsx         # Header con búsqueda
│   ├── projects/                  # Componentes de proyectos
│   ├── backlogs/                  # Componentes de backlogs
│   ├── sprints/                   # Componentes de sprints
│   └── ui/                        # Componentes Shadcn/UI
├── lib/
│   ├── auth/
│   │   └── auth-context.tsx       # Context de autenticación
│   └── utils.ts                   # Utilidades (cn, etc.)
├── db.json                        # Base de datos JSON Server
├── middleware.ts                  # Protección de rutas
├── package.json
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

## 🤖 Funcionalidades de IA Simulada

### Generación de Proyectos
- Objetivos SMART automáticos
- Descripción contextual
- Sugerencias de equipo
- Consumo: 20 tokens

### Generación de Backlogs
- 5 user stories priorizadas
- Formato "Como/Quiero/Para"
- Criterios de aceptación detallados
- Métricas BLEU/ROUGE >85%
- Consumo: 30 tokens

### Generación de Sprints
- Descomposición en 4 tareas por user story
- Asignación inteligente por rol
- Estimación de horas
- Identificación de dependencias
- Consumo: 25 tokens

### Asistente IA
- Respuestas contextuales sobre Scrum
- Generación de contenido
- Asesoría en metodologías
- Consumo: 15 tokens por mensaje

## 📊 Endpoints de JSON Server

\`\`\`
GET    /users              # Listar usuarios
GET    /users/:id          # Obtener usuario
POST   /users              # Crear usuario
PATCH  /users/:id          # Actualizar usuario

GET    /projects           # Listar proyectos
GET    /projects/:id       # Obtener proyecto
POST   /projects           # Crear proyecto
PATCH  /projects/:id       # Actualizar proyecto
DELETE /projects/:id       # Eliminar proyecto

GET    /backlogs           # Listar backlogs
GET    /backlogs/:id       # Obtener backlog
POST   /backlogs           # Crear backlog
PATCH  /backlogs/:id       # Actualizar backlog

GET    /sprints            # Listar sprints
GET    /sprints/:id        # Obtener sprint
POST   /sprints            # Crear sprint
PATCH  /sprints/:id        # Actualizar sprint
\`\`\`

## 🚀 Scripts Disponibles

\`\`\`bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter
\`\`\`

## 📝 Roadmap Futuro

- [ ] Integración con APIs reales de IA (OpenAI, Anthropic)
- [ ] Base de datos real (PostgreSQL, MongoDB)
- [ ] Autenticación real (NextAuth, Clerk)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integraciones (Jira, GitHub, Slack)
- [ ] Modo offline con PWA
- [ ] Tests unitarios y E2E
- [ ] Internacionalización (i18n)
- [ ] Tema claro/oscuro

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

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [JSON Server](https://github.com/typicode/json-server)

---

**Nota**: Este proyecto utiliza datos mockeados y simulaciones de IA para propósitos de demostración. Para un entorno de producción, se recomienda integrar servicios reales de autenticación, base de datos y APIs de IA.
