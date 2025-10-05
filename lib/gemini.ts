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
    "startDate": "${todayStr}",
    "estimatedEndDate": "YYYY-MM-DD (formato exacto, ejemplo: 2026-03-15)",
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
  sprints?: any[]
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

CONTEXTO DEL PROYECTO ACTUAL:
- Nombre: ${projectContext.projectName}
- Descripción: ${projectContext.description}
${projectContext.objectives ? `- Objetivos: ${JSON.stringify(projectContext.objectives, null, 2)}` : ""}
${projectContext.timeline ? `- Timeline: ${JSON.stringify(projectContext.timeline, null, 2)}` : ""}
${projectContext.productBacklog ? `- Product Backlog (${projectContext.productBacklog.length} items): ${JSON.stringify(projectContext.productBacklog.slice(0, 5), null, 2)}${projectContext.productBacklog.length > 5 ? "\n... (y más items)" : ""}` : ""}
${projectContext.sprints ? `- Sprints: ${projectContext.sprints.length} sprints planificados` : ""}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory || "No hay mensajes previos"}

MENSAJE ACTUAL DEL USUARIO:
${userMessage}

INSTRUCCIONES:
- Responde de manera conversacional y profesional
- Usa el contexto del proyecto para dar respuestas específicas y relevantes
- Si el usuario pide modificaciones, explica qué cambios harías (aunque no puedas ejecutarlos directamente)
- Si el usuario pide crear/modificar User Stories, backlog items, o sprints, genera la estructura JSON correspondiente
- Puedes sugerir mejoras, detectar problemas, o hacer recomendaciones basadas en mejores prácticas
- Mantén un tono amigable pero profesional

Responde ahora al mensaje del usuario:
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
