import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * Initialize Gemini AI client
 */
function getGeminiClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Gemini API key is not configured")
  }

  return new GoogleGenerativeAI(apiKey)
}

/**
 * Structured prompt interface for project generation
 */
export interface StructuredPrompt {
  objective: string
  role: string
  context: string
  constraints: string
}

/**
 * Build a structured prompt for Gemini
 */
function buildStructuredPrompt(prompt: StructuredPrompt): string {
  // Get current date context
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  const currentYear = today.getFullYear()
  const currentMonth = today.toLocaleString('es-ES', { month: 'long' })
  
  return `
Como experto en gestión de proyectos Scrum, analiza la siguiente información y genera una estructura completa de proyecto:

**FECHA ACTUAL: ${todayStr} (${currentMonth} ${currentYear})**
⚠️ CRÍTICO: Todas las fechas DEBEN ser iguales o posteriores a ${todayStr}. NO uses años pasados (2023, 2024, etc).

**OBJETIVO:**
${prompt.objective}

**ROL DEL USUARIO:**
${prompt.role}

**CONTEXTO DEL PROYECTO:**
${prompt.context}

**RESTRICCIONES Y LÍMITES:**
${prompt.constraints}

Por favor, genera una respuesta en formato JSON con la siguiente estructura:
{
  "projectName": "Nombre del proyecto",
  "description": "Descripción detallada del proyecto",
  "objectives": ["Objetivo SMART 1", "Objetivo SMART 2", ...],
  "timeline": {
    "start": "${todayStr}",
    "end": "YYYY-MM-DD (formato exacto, ejemplo: 2026-03-15)",
    "milestones": [
      {
        "name": "Milestone 1",
        "date": "YYYY-MM-DD (formato exacto, ejemplo: 2026-01-15)",
        "description": "Descripción"
      }
    ]
  },
  "teamRoles": [
    {
      "role": "Scrum Master | Product Owner | Developer",
      "responsibilities": ["Responsabilidad 1", "Responsabilidad 2"],
      "quantity": 1
    }
  ],
  "productBacklog": [
    {
      "title": "User Story título",
      "description": "Como [rol], quiero [acción] para [beneficio]",
      "priority": "Alta | Media | Baja",
      "storyPoints": 5,
      "acceptanceCriteria": ["Criterio 1", "Criterio 2"]
    }
  ]
}

**IMPORTANTE sobre el Product Backlog:**
- Genera entre 15 y 20 User Stories bien estructuradas
- Prioriza las User Stories (40% Alta, 40% Media, 20% Baja)
- Story Points entre 1-13 (escala Fibonacci)
- Cada User Story debe tener 3-5 criterios de aceptación específicos
- Incluye User Stories para funcionalidades core, autenticación, y gestión de datos

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin texto adicional antes o después.
`.trim()
}

/**
 * Generate project structure using Gemini AI
 */
export async function generateProjectWithGemini(
  prompt: StructuredPrompt,
  onProgress?: (chunk: string) => void
): Promise<any> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const structuredPrompt = buildStructuredPrompt(prompt)

  if (onProgress) {
    // Stream response for iterative chat
    const result = await model.generateContentStream(structuredPrompt)
    let fullText = ""

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      onProgress(chunkText)
    }

    return parseGeminiResponse(fullText)
  } else {
    // Non-streaming response
    const result = await model.generateContent(structuredPrompt)
    const response = await result.response
    const text = response.text()

    return parseGeminiResponse(text)
  }
}

/**
 * Parse Gemini response and extract JSON
 */
function parseGeminiResponse(text: string): any {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim()
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/```\s*$/, "")
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/```\s*$/, "")
    }

    return JSON.parse(cleanText)
  } catch (error) {
    console.error("Error parsing Gemini response:", error)
    console.error("Raw response:", text)
    throw new Error("Failed to parse AI response. Please try again.")
  }
}

/**
 * Generate backlog items with Gemini
 */
export async function generateBacklogWithGemini(
  projectDescription: string,
  onProgress?: (chunk: string) => void
): Promise<any[]> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const prompt = `
Como Product Owner experto, genera un product backlog detallado para el siguiente proyecto:

${projectDescription}

Genera al menos 10 user stories en formato JSON con esta estructura:
[
  {
    "title": "Título corto de la user story",
    "description": "Como [rol], quiero [acción] para [beneficio]",
    "priority": "Alta | Media | Baja",
    "storyPoints": 1-13,
    "acceptanceCriteria": ["Criterio 1", "Criterio 2", "Criterio 3"],
    "epic": "Nombre del Epic al que pertenece"
  }
]

IMPORTANTE: Responde ÚNICAMENTE con el JSON array válido.
`.trim()

  if (onProgress) {
    const result = await model.generateContentStream(prompt)
    let fullText = ""

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      onProgress(chunkText)
    }

    return parseGeminiResponse(fullText)
  } else {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return parseGeminiResponse(text)
  }
}

/**
 * Generate sprint plan with Gemini
 */
export async function generateSprintWithGemini(
  backlogItems: any[],
  sprintDuration: string,
  teamCapacity: number,
  onProgress?: (chunk: string) => void
): Promise<any> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const prompt = `
Como Scrum Master experto, planifica un sprint con la siguiente información:

BACKLOG ITEMS:
${JSON.stringify(backlogItems, null, 2)}

DURACIÓN DEL SPRINT: ${sprintDuration}
CAPACIDAD DEL EQUIPO: ${teamCapacity} story points

Genera un plan de sprint en formato JSON:
{
  "name": "Sprint X",
  "goal": "Objetivo claro y medible del sprint",
  "duration": "${sprintDuration}",
  "selectedItems": [
    {
      "userStoryId": "ID de la user story",
      "tasks": [
        {
          "title": "Tarea específica",
          "description": "Descripción detallada",
          "estimatedHours": 4-16,
          "assignedRole": "Developer | Designer | Tester"
        }
      ]
    }
  ],
  "dailySchedule": {
    "dailyScrum": "09:00 AM",
    "duration": "15 minutos"
  },
  "retrospective": {
    "date": "Último día del sprint",
    "topics": ["Tema 1", "Tema 2"]
  }
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido.
`.trim()

  if (onProgress) {
    const result = await model.generateContentStream(prompt)
    let fullText = ""

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      onProgress(chunkText)
    }

    return parseGeminiResponse(fullText)
  } else {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return parseGeminiResponse(text)
  }
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

/**
 * Project context for chat
 */
export interface ProjectContext {
  projectName: string
  description: string
  objectives?: any[]
  productBacklog?: any[]
  tasks?: any[]
  sprints?: any[]
  teamMembers?: any[]
  timeline?: any
}

/**
 * Generate chat response with project context (iterative chat)
 */
export async function chatWithGemini(
  projectContext: ProjectContext,
  chatHistory: ChatMessage[],
  userMessage: string,
  onProgress?: (chunk: string) => void
): Promise<string> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  // Build conversation history
  const conversationHistory = chatHistory
    .map((msg) => {
      const role = msg.role === "user" ? "Usuario" : "Asistente"
      return `${role}: ${msg.content}`
    })
    .join("\n\n")

  const prompt = `
Eres un asistente experto en gestión de proyectos Scrum y Domain-Driven Design (DDD).

CONTEXTO COMPLETO DEL PROYECTO:

📋 **INFORMACIÓN GENERAL**
- Nombre: ${projectContext.projectName}
- Descripción: ${projectContext.description}
${projectContext.objectives ? `- Objetivos SMART: ${projectContext.objectives.length} objetivos definidos
${projectContext.objectives.map((obj: string, i: number) => `  ${i + 1}. ${obj}`).join('\n')}` : ""}
${projectContext.timeline ? `- Timeline: 
  • Inicio: ${projectContext.timeline.start || projectContext.timeline.startDate || 'No definido'}
  • Fin estimado: ${projectContext.timeline.end || projectContext.timeline.estimatedEndDate || 'No definido'}` : ""}

${projectContext.teamMembers && projectContext.teamMembers.length > 0 ? `
👥 **EQUIPO DEL PROYECTO**
- Total de miembros: ${projectContext.teamMembers.length}
${projectContext.teamMembers.map((member: any) => `  • ${member.name} - ${member.role} (${member.email})`).join('\n')}
` : ""}

${projectContext.productBacklog && projectContext.productBacklog.length > 0 ? `
📝 **PRODUCT BACKLOG**
- Total User Stories: ${projectContext.productBacklog.length}
- Distribución por prioridad:
  • Alta: ${projectContext.productBacklog.filter((us: any) => us.priority?.toLowerCase() === 'alta' || us.priority?.toLowerCase() === 'high').length} US
  • Media: ${projectContext.productBacklog.filter((us: any) => us.priority?.toLowerCase() === 'media' || us.priority?.toLowerCase() === 'medium').length} US
  • Baja: ${projectContext.productBacklog.filter((us: any) => us.priority?.toLowerCase() === 'baja' || us.priority?.toLowerCase() === 'low').length} US
- Story Points totales: ${projectContext.productBacklog.reduce((sum: number, us: any) => sum + (us.storyPoints || 0), 0)} puntos
- Estado actual:
  • Pendientes: ${projectContext.productBacklog.filter((us: any) => us.status === 'pending' || us.status === 'todo').length}
  • En progreso: ${projectContext.productBacklog.filter((us: any) => us.status === 'in_progress').length}
  • Completadas: ${projectContext.productBacklog.filter((us: any) => us.status === 'done').length}

**User Stories del backlog:**
${projectContext.productBacklog.slice(0, 15).map((us: any, i: number) => 
  `${i + 1}. "${us.title}" 
     - ${us.storyPoints} pts | Prioridad: ${us.priority} | Estado: ${us.status}
     - ${us.description}`
).join('\n')}
${projectContext.productBacklog.length > 15 ? `\n... y ${projectContext.productBacklog.length - 15} User Stories más` : ''}
` : ""}

${projectContext.tasks && projectContext.tasks.length > 0 ? `
✅ **TAREAS DEL PROYECTO**
- Total de tareas: ${projectContext.tasks.length}
- Por estado:
  • To Do: ${projectContext.tasks.filter((t: any) => t.status === 'todo').length}
  • En progreso: ${projectContext.tasks.filter((t: any) => t.status === 'in_progress').length}
  • Completadas: ${projectContext.tasks.filter((t: any) => t.status === 'done').length}
- Horas estimadas totales: ${projectContext.tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0)} horas

**Asignación de tareas por miembro:**
${projectContext.teamMembers && projectContext.tasks ? projectContext.teamMembers.map((member: any) => {
  const memberTasks = projectContext.tasks!.filter((t: any) => t.assignedTo === member.id)
  return `• ${member.name}: ${memberTasks.length} tareas asignadas
${memberTasks.slice(0, 3).map((t: any) => `    - "${t.title}" (${t.status}, ${t.estimatedHours}h)`).join('\n')}${memberTasks.length > 3 ? `\n    ... y ${memberTasks.length - 3} más` : ''}`
}).join('\n') : 'No hay tareas asignadas aún'}

${projectContext.tasks.filter((t: any) => !t.assignedTo).length > 0 ? `• Sin asignar: ${projectContext.tasks.filter((t: any) => !t.assignedTo).length} tareas` : ''}
` : ""}

${projectContext.sprints && projectContext.sprints.length > 0 ? `
🏃 **SPRINTS**
- Total de sprints: ${projectContext.sprints.length}
${projectContext.sprints.map((sprint: any, i: number) => 
  `${i + 1}. Sprint "${sprint.name}" (${sprint.status})
     - Objetivo: ${sprint.goal}
     - Fechas: ${sprint.startDate} a ${sprint.endDate}`
).join('\n')}
` : ""}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory || "No hay mensajes previos"}

MENSAJE ACTUAL DEL USUARIO:
${userMessage}

═══════════════════════════════════════════════════════════════

INSTRUCCIONES PARA TI COMO ASISTENTE:

📌 **RESPONDE CON INFORMACIÓN PRECISA:**
- Usa SIEMPRE los datos del contexto para responder
- Si preguntan "cuántas US hay", responde: "${projectContext.productBacklog?.length || 0} User Stories"
- Si preguntan por tareas de un usuario, busca en la sección "Asignación de tareas por miembro"
- Si preguntan por objetivos, lista los ${projectContext.objectives?.length || 0} objetivos SMART

🎯 **CAPACIDADES PARA MODIFICACIONES:**
Cuando el usuario pida crear o modificar elementos del proyecto:

1. **Crear User Stories nuevas:** Genera JSON con formato:
\`\`\`json
{
  "action": "create_user_stories",
  "items": [
    {
      "title": "Título descriptivo",
      "description": "Como [rol], quiero [acción] para [beneficio]",
      "priority": "Alta|Media|Baja",
      "storyPoints": 3,
      "acceptanceCriteria": ["Criterio 1", "Criterio 2", "Criterio 3"],
      "status": "pending"
    }
  ]
}
\`\`\`

2. **Agregar objetivos:** Genera objetivos SMART (Específicos, Medibles, Alcanzables, Relevantes, Temporales)

3. **Crear tareas:** Desglosa User Stories en tareas técnicas con estimaciones realistas

4. **Planificar sprints:** Sugiere sprints de 2 semanas con capacidad balanceada

💡 **MEJORES PRÁCTICAS:**
- Detecta anti-patterns (US muy grandes, falta de criterios de aceptación, etc.)
- Sugiere refinamientos del backlog
- Identifica riesgos en el timeline o carga de trabajo
- Recomienda priorización basada en valor de negocio

Responde ahora de manera conversacional, profesional y útil:
`.trim()

  if (onProgress) {
    const result = await model.generateContentStream(prompt)
    let fullText = ""

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      onProgress(chunkText)
    }

    return fullText
  } else {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }
}
