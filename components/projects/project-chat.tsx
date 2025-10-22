"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2, CheckCircle2, AlertCircle, Paperclip, X, Image as ImageIcon, FileText } from "lucide-react"
import { chatWithGemini, ChatMessage, ProjectContext } from "@/lib/gemini"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectChatProps {
  projectId: string
  projectContext: ProjectContext
  initialPrompt?: {
    objective: string
    role: string
    context: string
    constraints: string
  }
  onDataUpdate?: () => void // Callback para refrescar datos sin reload
}

export function ProjectChat({ projectId, projectContext, initialPrompt, onDataUpdate }: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [attachedFilePreviews, setAttachedFilePreviews] = useState<{file: File, preview: string | null}[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const { user, checkLimits, updateUsage } = useAuth()
  const { toast } = useToast()

  // Load chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem(`chat-${projectId}`)
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat)
        setMessages(parsed)
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    } else if (initialPrompt) {
      // If no saved chat and there's an initial prompt, create first message
      const initialUserMessage: ChatMessage = {
        id: `msg-initial-user`,
        role: "user",
        content: `He creado un proyecto con los siguientes parámetros:

📋 **Objetivo:** ${initialPrompt.objective}
👤 **Mi Rol:** ${initialPrompt.role}
🎯 **Contexto:** ${initialPrompt.context}
⚠️ **Restricciones:** ${initialPrompt.constraints}

El sistema generó el proyecto "${projectContext.projectName}". ¿Qué te parece el resultado y qué recomendaciones tienes?`,
        timestamp: new Date().toISOString(),
      }
      setMessages([initialUserMessage])
    }
  }, [projectId, initialPrompt, projectContext.projectName])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-${projectId}`, JSON.stringify(messages))
    }
  }, [messages, projectId])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingMessage])

  /**
   * Handle file attachment (multiple files support)
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'document') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file already exists
    if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
      toast({
        title: "Archivo ya adjuntado",
        description: `El archivo "${file.name}" ya está en la lista`,
        variant: "destructive",
      })
      return
    }

    // Validate maximum files (e.g., 5 files max)
    if (attachedFiles.length >= 5) {
      toast({
        title: "Límite alcanzado",
        description: "Máximo 5 archivos por mensaje",
        variant: "destructive",
      })
      return
    }

    if (fileType === 'image') {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de archivo no soportado",
          description: "Solo se permiten imágenes (JPG, PNG, GIF, WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El tamaño máximo permitido es 10MB por imagen",
          variant: "destructive",
        })
        return
      }

      // Generate preview for images
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        setAttachedFilePreviews(prev => [...prev, { file, preview }])
      }
      reader.readAsDataURL(file)
    } else {
      // Validate document type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ]
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no soportado",
          description: "Solo se permiten PDF, Word, Excel o archivos de texto",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 20MB for documents)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El tamaño máximo permitido es 20MB por documento",
          variant: "destructive",
        })
        return
      }

      // No preview for documents
      setAttachedFilePreviews(prev => [...prev, { file, preview: null }])
    }

    // Add file to array
    setAttachedFiles(prev => [...prev, file])
    
    // Reset input to allow selecting same file again later
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (documentInputRef.current) documentInputRef.current.value = ''
  }

  /**
   * Remove specific attached file
   */
  const handleRemoveFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(f => f !== fileToRemove))
    setAttachedFilePreviews(prev => prev.filter(p => p.file !== fileToRemove))
  }

  /**
   * Clear all attached files
   */
  const clearAllFiles = () => {
    setAttachedFiles([])
    setAttachedFilePreviews([])
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = ''
    }
  }

  /**
   * Execute actions from AI response (create user stories, tasks, etc.)
   */
  const executeActionsFromResponse = async (response: string) => {
    try {
      // Extract JSON blocks from response
      const jsonMatches = response.match(/```json\n([\s\S]*?)\n```/g)
      
      if (!jsonMatches) return

      for (const match of jsonMatches) {
        const jsonString = match.replace(/```json\n/g, '').replace(/\n```/g, '')
        const actionData = JSON.parse(jsonString)

        // Handle different action types
        if (actionData.action === 'create_user_stories') {
          await createUserStories(actionData.items)
        } else if (actionData.action === 'delete_user_stories') {
          await deleteUserStories(actionData.items)
        } else if (actionData.action === 'create_tasks') {
          await createTasks(actionData.items)
        } else if (actionData.action === 'update_objectives') {
          await updateObjectives(actionData.objectives)
        }
      }
    } catch (error) {
      console.error("Error executing actions:", error)
    }
  }

  /**
   * Clean JSON blocks from AI response for display
   */
  const cleanResponseForDisplay = (response: string): string => {
    // Remove JSON code blocks (including partial ones during streaming)
    let cleaned = response.replace(/```json[\s\S]*?```/g, '')
    
    // Remove any remaining ``` markers
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
    
    // Remove lines that look like JSON
    cleaned = cleaned.split('\n').filter(line => {
      const trimmed = line.trim()
      // Skip lines that are clearly JSON structure
      if (trimmed.startsWith('{') || 
          trimmed.startsWith('}') || 
          trimmed.startsWith('[') ||
          trimmed.startsWith(']') ||
          trimmed.includes('"action"') ||
          trimmed.includes('"items"') ||
          trimmed.includes('"title"') && trimmed.includes(':') ||
          trimmed.includes('"description"') && trimmed.includes(':')) {
        return false
      }
      return true
    }).join('\n')
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()
    
    return cleaned
  }

  /**
   * Format text with markdown-like syntax to HTML
   */
  const formatMessageContent = (content: string): React.ReactNode => {
    // Split by lines to preserve structure
    const lines = content.split('\n')
    
    return lines.map((line, index) => {
      // Convert **text** to bold
      let formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      
      // Convert *text* to italic
      formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {index < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  /**
   * Create user stories from AI suggestion
   */
  const createUserStories = async (items: any[]) => {
    // Show "Generating" message
    const generatingMessage: ChatMessage = {
      id: `msg-${Date.now()}-generating`,
      role: "assistant",
      content: `⏳ **Generando User Stories...**\n\nEstoy creando ${items.length} User ${items.length === 1 ? 'Story' : 'Stories'} y sus tareas asociadas en el backlog del proyecto. Esto tomará solo unos segundos...`,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, generatingMessage])

    try {
      const createdStories = []
      const createdTasks = []
      
      for (const item of items) {
        const userStory = {
          title: item.title,
          description: item.description,
          priority: item.priority,
          storyPoints: item.storyPoints,
          acceptanceCriteria: item.acceptanceCriteria,
          status: item.status || 'pending',
          projectId: projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userStory),
        })

        const created = await response.json()
        createdStories.push(created)

        // Create tasks for this user story (MANDATORY)
        const tasksForStory = [
          {
            title: `Diseñar UI para ${item.title}`,
            description: `Crear mockups y diseño de interfaz para: ${item.description}`,
            userStoryId: created.id,
            projectId: projectId,
            assignedTo: null,
            status: "todo",
            priority: item.priority,
            estimatedHours: Math.max(2, Math.floor(item.storyPoints * 0.5)),
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            aiGenerated: true,
          },
          {
            title: `Implementar backend para ${item.title}`,
            description: `Desarrollar lógica de negocio y APIs para: ${item.description}`,
            userStoryId: created.id,
            projectId: projectId,
            assignedTo: null,
            status: "todo",
            priority: item.priority,
            estimatedHours: Math.max(4, Math.floor(item.storyPoints * 0.8)),
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            aiGenerated: true,
          },
          {
            title: `Implementar frontend para ${item.title}`,
            description: `Desarrollar componentes y vistas para: ${item.description}`,
            userStoryId: created.id,
            projectId: projectId,
            assignedTo: null,
            status: "todo",
            priority: item.priority,
            estimatedHours: Math.max(3, Math.floor(item.storyPoints * 0.6)),
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            aiGenerated: true,
          },
          {
            title: `Testing para ${item.title}`,
            description: `Pruebas unitarias e integración para: ${item.description}`,
            userStoryId: created.id,
            projectId: projectId,
            assignedTo: null,
            status: "todo",
            priority: item.priority,
            estimatedHours: Math.max(2, Math.floor(item.storyPoints * 0.4)),
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            aiGenerated: true,
          },
        ]

        // Create all tasks for this user story
        for (const task of tasksForStory) {
          try {
            const taskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(task),
            })
            
            if (taskResponse.ok) {
              const createdTask = await taskResponse.json()
              createdTasks.push(createdTask)
            }
          } catch (error) {
            console.error(`Error creating task: ${task.title}`, error)
          }
        }
      }

      // Remove "generating" message
      setMessages((prev) => prev.filter(m => m.id !== generatingMessage.id))

      // Update user stories usage
      await updateUsage("userStories", items.length)

      // Show success message
      toast({
        title: "✅ User Stories creadas",
        description: `Se crearon ${createdStories.length} User Stories y ${createdTasks.length} tareas para el proyecto`,
      })

      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `msg-${Date.now()}-system`,
        role: "assistant",
        content: `✅ **¡Backlog actualizado!**\n\nSe ${createdStories.length === 1 ? 'creó' : 'crearon'} ${createdStories.length} User ${createdStories.length === 1 ? 'Story' : 'Stories'} y ${createdTasks.length} tareas exitosamente:\n\n${createdStories.map((s, i) => `**${i + 1}.** ${s.title} *(${s.storyPoints} pts)*`).join('\n')}\n\n🎯 **Cada User Story incluye 4 tareas:**\n- Diseño UI\n- Implementación Backend\n- Implementación Frontend\n- Testing\n\nPuedes verlas en la pestaña **Backlog** del proyecto.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, confirmationMessage])

      // Notificar al padre que hay nuevos datos (actualiza sin reload)
      if (onDataUpdate) {
        onDataUpdate()
      }
    } catch (error) {
      console.error("Error creating user stories:", error)
      
      // Remove "generating" message
      setMessages((prev) => prev.filter(m => m.id !== generatingMessage.id))
      
      toast({
        title: "Error",
        description: "No se pudieron crear las User Stories",
        variant: "destructive",
      })

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `❌ **Error al crear User Stories**\n\nHubo un problema al guardar las User Stories. Por favor, intenta nuevamente.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  /**
   * Find User Stories by criteria (title, priority, status, story points)
   */
  const findUserStoriesByCriteria = (criteria: {
    title?: string
    priority?: string
    status?: string
    storyPoints?: number
    id?: string
  }): any[] => {
    if (!projectContext.productBacklog) return []

    return projectContext.productBacklog.filter((us) => {
      // Check ID first (exact match)
      if (criteria.id && us.id === criteria.id) return true

      let matches = true

      // Check title (partial match, case insensitive)
      if (criteria.title) {
        matches = matches && us.title.toLowerCase().includes(criteria.title.toLowerCase())
      }

      // Check priority (case insensitive)
      if (criteria.priority) {
        matches = matches && us.priority?.toLowerCase() === criteria.priority.toLowerCase()
      }

      // Check status
      if (criteria.status) {
        matches = matches && us.status?.toLowerCase() === criteria.status.toLowerCase()
      }

      // Check story points
      if (criteria.storyPoints !== undefined) {
        matches = matches && us.storyPoints === criteria.storyPoints
      }

      return matches
    })
  }

  /**
   * Delete user stories from AI suggestion
   */
  const deleteUserStories = async (items: any[]) => {
    // Show "Deleting" message
    const deletingMessage: ChatMessage = {
      id: `msg-${Date.now()}-deleting`,
      role: "assistant",
      content: `🗑️ **Eliminando User Stories...**\n\nEstoy eliminando ${items.length} User ${items.length === 1 ? 'Story' : 'Stories'} del backlog del proyecto...`,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, deletingMessage])

    try {
      const deletedStories = []
      const errors = []
      
      for (const item of items) {
        try {
          let userStoryId = item.id

          // If no ID provided, try to find by criteria
          if (!userStoryId) {
            const matchingStories = findUserStoriesByCriteria({
              title: item.title,
              priority: item.priority,
              status: item.status,
              storyPoints: item.storyPoints,
            })

            if (matchingStories.length === 1) {
              userStoryId = matchingStories[0].id
            } else if (matchingStories.length > 1) {
              errors.push(`Se encontraron múltiples coincidencias para: "${item.title}"`)
              continue
            } else {
              errors.push(`No se encontró la User Story: "${item.title}"`)
              continue
            }
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${userStoryId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            deletedStories.push({ id: userStoryId, title: item.title || 'US sin título' })
          } else {
            errors.push(`Error al eliminar: "${item.title || userStoryId}"`)
          }
        } catch (error) {
          errors.push(`Error al eliminar: "${item.title || 'US desconocida'}"`)
        }
      }

      // Remove "deleting" message
      setMessages((prev) => prev.filter(m => m.id !== deletingMessage.id))

      if (deletedStories.length > 0) {
        // Show success message
        toast({
          title: "✅ User Stories eliminadas",
          description: `Se eliminaron ${deletedStories.length} User Stories del proyecto`,
        })

        // Add confirmation message to chat
        const confirmationMessage: ChatMessage = {
          id: `msg-${Date.now()}-system`,
          role: "assistant",
          content: `✅ **¡Backlog actualizado!**\n\nSe ${deletedStories.length === 1 ? 'eliminó' : 'eliminaron'} ${deletedStories.length} User ${deletedStories.length === 1 ? 'Story' : 'Stories'} exitosamente:\n${deletedStories.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}${errors.length > 0 ? `\n\n⚠️ **Advertencias:**\n${errors.join('\n')}` : ''}\n\nPuedes verificar los cambios en la pestaña **Backlog** del proyecto.`,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, confirmationMessage])

        // Notificar al padre que hay nuevos datos (actualiza sin reload)
        if (onDataUpdate) {
          onDataUpdate()
        }
      } else {
        // All failed
        toast({
          title: "Error",
          description: "No se pudieron eliminar las User Stories",
          variant: "destructive",
        })

        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `❌ **Error al eliminar User Stories**\n\n${errors.join('\n')}\n\nPor favor, verifica los nombres o IDs e intenta nuevamente.`,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error deleting user stories:", error)
      
      // Remove "deleting" message
      setMessages((prev) => prev.filter(m => m.id !== deletingMessage.id))
      
      toast({
        title: "Error",
        description: "No se pudieron eliminar las User Stories",
        variant: "destructive",
      })

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `❌ **Error al eliminar User Stories**\n\nHubo un problema al eliminar las User Stories. Por favor, intenta nuevamente.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  /**
   * Create tasks from AI suggestion
   */
  const createTasks = async (items: any[]) => {
    // TODO: Implement task creation
    toast({
      title: "Funcionalidad pendiente",
      description: "La creación de tareas estará disponible pronto",
    })
  }

  /**
   * Update project objectives from AI suggestion
   */
  const updateObjectives = async (objectives: string[]) => {
    // TODO: Implement objectives update
    toast({
      title: "Funcionalidad pendiente",
      description: "La actualización de objetivos estará disponible pronto",
    })
  }

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

    // Check limits (10 tokens per file + 5 base)
    const tokensRequired = attachedFiles.length > 0 ? 5 + (attachedFiles.length * 10) : 5
    if (!checkLimits("tokens", tokensRequired)) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de tokens. Actualiza a Premium para continuar.",
        variant: "destructive",
      })
      return
    }

    // Build file labels
    let fileLabels: string[] = []
    if (attachedFiles.length > 0) {
      fileLabels = attachedFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return `📷 [Imagen: ${file.name}]`
        } else {
          return `📄 [Documento: ${file.name}]`
        }
      })
    }

    // Create user message content
    let messageContent = ""
    if (input.trim() && attachedFiles.length > 0) {
      // Both text and files: show text + file labels
      messageContent = `${input}\n\n${fileLabels.join('\n')}`
    } else if (attachedFiles.length > 0) {
      // Only files: show file labels
      messageContent = fileLabels.join('\n')
    } else {
      // Only text
      messageContent = input
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    const currentFiles = [...attachedFiles]
    setInput("")
    clearAllFiles()
    setIsLoading(true)
    setStreamingMessage("")

    try {
      let fullResponse = ""
      
      // Create proper prompt for file analysis
      let promptText = currentInput
      if (!promptText && currentFiles.length > 0) {
        if (currentFiles.length === 1) {
          if (currentFiles[0].type.startsWith('image/')) {
            promptText = "Analiza esta imagen y dame información relevante para el proyecto"
          } else {
            promptText = "Analiza este documento y extrae la información relevante para el proyecto"
          }
        } else {
          promptText = `Analiza estos ${currentFiles.length} archivos y extrae toda la información relevante para el proyecto`
        }
      }
      
      const response = await chatWithGemini(
        projectContext,
        messages,
        promptText,
        currentFiles.length > 0 ? currentFiles : undefined,
        (chunk: string) => {
          fullResponse += chunk
          // Only show chunks that are not JSON
          const withoutJson = cleanResponseForDisplay(fullResponse)
          setStreamingMessage(withoutJson)
        }
      )

      // Clean response (remove JSON blocks)
      const cleanedResponse = cleanResponseForDisplay(response)

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: cleanedResponse,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingMessage("")

      // Check if response contains actionable JSON
      await executeActionsFromResponse(response)

      // Update token usage
      await updateUsage("tokens", tokensRequired)
    } catch (error) {
      console.error("Error in chat:", error)
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta de la IA. Verifica tu conexión.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat con IA - {projectContext.projectName}
        </CardTitle>
        <CardDescription>
          Pregunta sobre el proyecto, pide modificaciones o mejoras. Puedes adjuntar imágenes 📷 o documentos 📄 (PDF, Word, Excel) para análisis con OCR
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Inicia una conversación sobre este proyecto.
                  <br />
                  Puedo ayudarte a analizar, mejorar y gestionar tu proyecto.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm">
                    {formatMessageContent(message.content)}
                  </div>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {isLoading && streamingMessage && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                  <div className="text-sm">
                    {formatMessageContent(streamingMessage)}
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingMessage && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* File attachments preview - multiple files */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 space-y-2">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs text-muted-foreground">
                {attachedFiles.length} archivo(s) adjuntado(s) - {(attachedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="h-6 text-xs"
              >
                Limpiar todo
              </Button>
            </div>
            {attachedFiles.map((file, index) => (
              <div key={index} className="p-2 border rounded-lg flex items-center gap-2 bg-muted">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFileSelect(e, 'document')}
            className="hidden"
          />
          
          {/* Dropdown menu for file attachment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={isLoading || attachedFiles.length >= 5}
                title={attachedFiles.length >= 5 ? "Máximo 5 archivos" : "Adjuntar archivo"}
              >
                <Paperclip className="h-4 w-4" />
                {attachedFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {attachedFiles.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Adjuntar imagen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => documentInputRef.current?.click()}>
                <FileText className="mr-2 h-4 w-4" />
                Adjuntar documento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={attachedFiles.length > 0 ? "Describe los archivos (opcional)..." : "Escribe tu mensaje..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
