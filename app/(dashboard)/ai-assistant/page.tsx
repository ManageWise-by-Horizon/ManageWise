"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Send, Bot, Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  tokensUsed?: number
}

const SUGGESTED_PROMPTS = [
  "¿Cómo organizar un Sprint Planning efectivo?",
  "Genera un backlog para una app de e-commerce",
  "¿Cuáles son las mejores prácticas para Daily Standups?",
  "Ayúdame a escribir criterios de aceptación",
  "Explica la diferencia entre Epic y User Story",
]

export default function AIAssistantPage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente IA de Manage Wize. Puedo ayudarte con metodologías Scrum, generar backlogs, escribir user stories, y responder preguntas sobre gestión de proyectos. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || loading) return

    // Verificar límites
    const isPremium = user?.subscription.plan === "premium"
    const tokensUsed = user?.subscription.tokensUsed || 0
    const tokensLimit = user?.subscription.tokensLimit || 100

    if (!isPremium && tokensUsed >= tokensLimit) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de tokens IA. Actualiza a Premium para continuar.",
        variant: "destructive",
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Simular llamada a API de IA
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generar respuesta simulada basada en el prompt
      const response = generateAIResponse(text)
      const tokensConsumed = 15

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        tokensUsed: tokensConsumed,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Actualizar tokens usados
      if (!isPremium && user) {
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            tokensUsed: tokensUsed + tokensConsumed,
          },
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        updateUser(updatedUser)

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: updatedUser.subscription }),
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAIResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes("sprint planning") || lowerPrompt.includes("planificación")) {
      return `Para organizar un Sprint Planning efectivo, te recomiendo seguir estos pasos:

1. **Preparación previa** (30 min antes):
   - Asegúrate de que el Product Backlog esté refinado y priorizado
   - Revisa la velocidad del equipo en sprints anteriores
   - Prepara el objetivo del sprint

2. **Primera parte - ¿Qué vamos a hacer?** (4 horas para sprint de 2 semanas):
   - El Product Owner presenta los items prioritarios del backlog
   - El equipo hace preguntas y aclara dudas
   - Se define el Sprint Goal (objetivo del sprint)
   - El equipo selecciona los items que puede completar

3. **Segunda parte - ¿Cómo lo vamos a hacer?** (4 horas):
   - El equipo descompone las user stories en tareas técnicas
   - Se estiman las tareas en horas
   - Se identifican dependencias y riesgos
   - Se crea el Sprint Backlog

**Tips clave:**
- Limita la reunión a 8 horas máximo para un sprint de 1 mes
- Asegúrate de que todo el equipo participe activamente
- No sobrecargues el sprint, deja margen para imprevistos
- Documenta el Sprint Goal de forma clara y visible

¿Necesitas ayuda con algún aspecto específico del Sprint Planning?`
    }

    if (lowerPrompt.includes("backlog") && (lowerPrompt.includes("genera") || lowerPrompt.includes("crear"))) {
      return `He generado un backlog inicial para una app de e-commerce. Aquí están las user stories priorizadas:

**Epic: Sistema de Autenticación**
1. Como usuario, quiero registrarme con email y contraseña para crear una cuenta
   - Prioridad: Alta | Story Points: 5
   - Criterios: Validación de email, contraseña segura (min 8 caracteres), confirmación por email

2. Como usuario, quiero iniciar sesión para acceder a mi cuenta
   - Prioridad: Alta | Story Points: 3
   - Criterios: Login con email/contraseña, recordar sesión, recuperar contraseña

**Epic: Catálogo de Productos**
3. Como usuario, quiero ver un catálogo de productos para explorar opciones de compra
   - Prioridad: Alta | Story Points: 8
   - Criterios: Grid responsive, imágenes optimizadas, paginación, filtros básicos

4. Como usuario, quiero buscar productos por nombre o categoría para encontrar lo que necesito
   - Prioridad: Media | Story Points: 5
   - Criterios: Búsqueda en tiempo real, sugerencias, filtros avanzados

**Epic: Carrito de Compras**
5. Como usuario, quiero agregar productos al carrito para comprarlos después
   - Prioridad: Alta | Story Points: 5
   - Criterios: Agregar/eliminar items, actualizar cantidades, persistencia

¿Quieres que genere más user stories o profundice en alguna de estas?`
    }

    if (lowerPrompt.includes("daily") || lowerPrompt.includes("standup")) {
      return `Las mejores prácticas para Daily Standups efectivos:

**Formato básico (15 minutos máximo):**
Cada miembro responde 3 preguntas:
1. ¿Qué hice ayer?
2. ¿Qué haré hoy?
3. ¿Tengo algún impedimento?

**Tips para mejorar tus Daily Standups:**

✓ **Mantén el tiempo:** Máximo 15 minutos, usa un timer
✓ **Mismo horario y lugar:** Crea consistencia y hábito
✓ **De pie:** Ayuda a mantener la reunión corta y enfocada
✓ **Enfócate en el Sprint Goal:** No es un reporte de status general
✓ **Identifica impedimentos:** Pero resuélvelos después, no durante el Daily
✓ **Todo el equipo participa:** Incluye developers, testers, diseñadores
✓ **Usa un tablero visual:** Kanban board para mantener contexto

**Errores comunes a evitar:**
✗ Convertirlo en un reporte al Scrum Master
✗ Resolver problemas durante la reunión
✗ Permitir que se extienda más de 15 minutos
✗ Discutir detalles técnicos profundos
✗ Que falten miembros del equipo

¿Tienes algún desafío específico con tus Daily Standups?`
    }

    if (lowerPrompt.includes("criterios de aceptación") || lowerPrompt.includes("acceptance criteria")) {
      return `Te ayudo a escribir criterios de aceptación efectivos. Usa el formato **Given-When-Then**:

**Ejemplo para: "Como usuario, quiero resetear mi contraseña para recuperar el acceso a mi cuenta"**

**Criterios de Aceptación:**

1. **Given** el usuario está en la página de login
   **When** hace clic en "¿Olvidaste tu contraseña?"
   **Then** es redirigido a la página de recuperación

2. **Given** el usuario está en la página de recuperación
   **When** ingresa su email registrado y hace clic en "Enviar"
   **Then** recibe un email con un link de reseteo válido por 1 hora

3. **Given** el usuario hace clic en el link del email
   **When** ingresa una nueva contraseña válida (min 8 caracteres, 1 mayúscula, 1 número)
   **Then** la contraseña se actualiza y puede iniciar sesión

4. **Given** el link de reseteo ha expirado (>1 hora)
   **When** el usuario intenta usarlo
   **Then** ve un mensaje de error y puede solicitar un nuevo link

**Tips para buenos criterios:**
- Sé específico y medible
- Incluye casos de error y validaciones
- Define límites y restricciones claras
- Piensa en la experiencia del usuario
- Asegúrate de que sean testeables

¿Quieres que te ayude con criterios para una user story específica?`
    }

    if (lowerPrompt.includes("epic") && lowerPrompt.includes("user story")) {
      return `Te explico la diferencia entre Epic y User Story:

**User Story:**
- Es una funcionalidad pequeña y específica
- Se puede completar en un sprint (1-2 semanas)
- Sigue el formato: "Como [rol], quiero [acción] para [beneficio]"
- Tiene criterios de aceptación detallados
- Estimada en Story Points (típicamente 1-13)

**Ejemplo:**
"Como usuario registrado, quiero poder editar mi perfil para mantener mi información actualizada"

**Epic:**
- Es una funcionalidad grande que agrupa varias user stories
- Toma múltiples sprints completarla (semanas o meses)
- Es demasiado grande para estimarse con precisión
- Se descompone en user stories más pequeñas
- Representa una capacidad o feature completa

**Ejemplo:**
"Sistema de Gestión de Usuarios" (Epic)
  ↓ Se descompone en:
  - Registro de usuarios (User Story)
  - Login y autenticación (User Story)
  - Edición de perfil (User Story)
  - Recuperación de contraseña (User Story)
  - Gestión de roles y permisos (User Story)

**Jerarquía típica:**
Theme > Epic > User Story > Task

**¿Cuándo usar cada uno?**
- Usa **Epics** para planificación a largo plazo y roadmaps
- Usa **User Stories** para planificación de sprints y desarrollo

¿Necesitas ayuda para descomponer un Epic en User Stories?`
    }

    // Respuesta genérica
    return `Entiendo tu pregunta sobre "${prompt}". 

Como asistente IA especializado en Scrum y gestión de proyectos, puedo ayudarte con:

- **Metodologías Scrum:** Sprint Planning, Daily Standups, Retrospectivas, Reviews
- **Gestión de Backlog:** Crear y priorizar user stories, definir Epics
- **Estimación:** Story Points, Planning Poker, técnicas de estimación
- **Criterios de Aceptación:** Formato Given-When-Then, mejores prácticas
- **Roles Scrum:** Product Owner, Scrum Master, Development Team
- **Métricas:** Velocity, Burndown Charts, Lead Time

¿Podrías reformular tu pregunta o elegir uno de los temas sugeridos? Estoy aquí para ayudarte a mejorar tu proceso de desarrollo ágil.`
  }

  if (!user) return null

  const isPremium = user.subscription.plan === "premium"
  const tokensUsed = user.subscription.tokensUsed
  const tokensLimit = user.subscription.tokensLimit
  const tokensPercentage = isPremium ? 0 : (tokensUsed / tokensLimit) * 100

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Asistente IA</h1>
              <p className="text-muted-foreground">Tu experto en Scrum y gestión de proyectos</p>
            </div>
          </div>
          <Badge variant={isPremium ? "default" : "secondary"}>
            {isPremium ? "Ilimitado" : `${tokensUsed}/${tokensLimit} tokens`}
          </Badge>
        </div>

        {!isPremium && tokensPercentage >= 80 && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-amber-500">
              Estás cerca del límite de tokens. Actualiza a Premium para uso ilimitado.
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="bg-primary/20">
                            <Bot className="w-4 h-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <span>
                            {message.timestamp.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.tokensUsed && (
                            <>
                              <span>•</span>
                              <span>{message.tokensUsed} tokens</span>
                            </>
                          )}
                        </div>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary/20">
                          <Bot className="w-4 h-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta sobre Scrum, backlogs, user stories..."
                    disabled={loading || (!isPremium && tokensUsed >= tokensLimit)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || loading || (!isPremium && tokensUsed >= tokensLimit)}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompts Sugeridos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 bg-transparent"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading || (!isPremium && tokensUsed >= tokensLimit)}
                >
                  <span className="text-sm line-clamp-2">{prompt}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Capacidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Generar backlogs y user stories con IA</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Asesoría en metodologías Scrum</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Ayuda con criterios de aceptación</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Mejores prácticas de estimación</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Resolución de dudas sobre roles Scrum</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
