"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Bot, CheckCircle2, AlertCircle, Paperclip, X, Image as ImageIcon, FileText, CalendarIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { generateProjectWithGemini, type StructuredPrompt } from "@/lib/gemini"
import { getMessageForStep } from "@/lib/generation-messages"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const { user, checkLimits, updateUsage } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Manual form
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  // Form validation errors
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  // AI Structured form
  const [objective, setObjective] = useState("")
  const [role, setRole] = useState("")
  const [context, setContext] = useState("")
  const [constraints, setConstraints] = useState("")

  // AI form validation errors
  const [aiErrors, setAiErrors] = useState({
    objective: "",
    role: "",
    context: "",
    constraints: "",
  })

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [attachedFilePreviews, setAttachedFilePreviews] = useState<{file: File, preview: string | null}[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // AI Generation state
  const [generationLog, setGenerationLog] = useState<string[]>([])
  const [generatedProject, setGeneratedProject] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Validation functions
  const validateManualForm = () => {
    const newErrors = {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    }

    // Validate name
    if (!name.trim()) {
      newErrors.name = "El nombre del proyecto es obligatorio"
    } else if (name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
    } else if (name.trim().length > 100) {
      newErrors.name = "El nombre no puede exceder 100 caracteres"
    }

    // Validate description
    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    } else if (description.trim().length < 10) {
      newErrors.description = "La descripción debe tener al menos 10 caracteres"
    } else if (description.trim().length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres"
    }

    // Validate start date
    if (!startDate) {
      newErrors.startDate = "La fecha de inicio es obligatoria"
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedStartDate = new Date(startDate)
      selectedStartDate.setHours(0, 0, 0, 0)
      
      if (selectedStartDate < today) {
        newErrors.startDate = "La fecha de inicio no puede ser en el pasado"
      }
    }

    // Validate end date
    if (!endDate) {
      newErrors.endDate = "La fecha de fin es obligatoria"
    } else if (startDate && endDate) {
      if (endDate <= startDate) {
        newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio"
      }
    }

    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === "")
  }

  const validateAIForm = () => {
    const newErrors = {
      objective: "",
      role: "",
      context: "",
      constraints: "",
    }

    // Validate objective
    if (!objective.trim()) {
      newErrors.objective = "El objetivo es obligatorio"
    } else if (objective.trim().length < 20) {
      newErrors.objective = "El objetivo debe tener al menos 20 caracteres"
    } else if (objective.trim().length > 300) {
      newErrors.objective = "El objetivo no puede exceder 300 caracteres"
    }

    // Validate role
    if (!role.trim()) {
      newErrors.role = "El rol del usuario es obligatorio"
    } else if (role.trim().length < 3) {
      newErrors.role = "El rol debe tener al menos 3 caracteres"
    } else if (role.trim().length > 50) {
      newErrors.role = "El rol no puede exceder 50 caracteres"
    }

    // Validate context
    if (!context.trim()) {
      newErrors.context = "El contexto es obligatorio"
    } else if (context.trim().length < 30) {
      newErrors.context = "El contexto debe tener al menos 30 caracteres"
    } else if (context.trim().length > 500) {
      newErrors.context = "El contexto no puede exceder 500 caracteres"
    }

    // Validate constraints
    if (!constraints.trim()) {
      newErrors.constraints = "Las restricciones son obligatorias"
    } else if (constraints.trim().length < 20) {
      newErrors.constraints = "Las restricciones deben tener al menos 20 caracteres"
    } else if (constraints.trim().length > 400) {
      newErrors.constraints = "Las restricciones no pueden exceder 400 caracteres"
    }

    setAiErrors(newErrors)
    return Object.values(newErrors).every(error => error === "")
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    })

    // Validate form
    if (!validateManualForm()) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor corrige los errores en el formulario antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newProject = {
        name,
        description,
        objectives: [],
        timeline: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString(),
        },
        members: [user?.id],
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        status: "active",
      }

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      })

      toast({
        title: "¡Proyecto creado exitosamente!",
        description: `${name} ha sido creado y está listo para usar`,
        className: "bg-green-600 text-white border-green-700",
      })

      resetForm()
      onOpenChange(false)
      onProjectCreated()
    } catch (error) {
      console.error("[v0] Error creating project:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no debe superar los 20MB",
        variant: "destructive",
      })
      return
    }

    // Check if already exists
    const isDuplicate = attachedFiles.some(
      f => f.name === file.name && f.size === file.size
    )
    if (isDuplicate) {
      toast({
        title: "Archivo duplicado",
        description: "Este archivo ya está adjuntado",
        variant: "destructive",
      })
      return
    }

    // Check limit (10 files for project creation)
    if (attachedFiles.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "Puedes adjuntar máximo 10 archivos",
        variant: "destructive",
      })
      return
    }

    // Add to files array
    setAttachedFiles(prev => [...prev, file])

    // Generate preview for images
    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachedFilePreviews(prev => [...prev, { file, preview: reader.result as string }])
      }
      reader.readAsDataURL(file)
    } else {
      setAttachedFilePreviews(prev => [...prev, { file, preview: null }])
    }

    toast({
      title: "Archivo adjuntado",
      description: `${file.name} se ha adjuntado correctamente`,
    })
  }

  const handleRemoveFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(f => f !== fileToRemove))
    setAttachedFilePreviews(prev => prev.filter(p => p.file !== fileToRemove))
    
    // Reset input values
    if (imageInputRef.current) imageInputRef.current.value = ""
    if (documentInputRef.current) documentInputRef.current.value = ""
  }

  const clearAllFiles = () => {
    setAttachedFiles([])
    setAttachedFilePreviews([])
    if (imageInputRef.current) imageInputRef.current.value = ""
    if (documentInputRef.current) documentInputRef.current.value = ""
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setAiErrors({
      objective: "",
      role: "",
      context: "",
      constraints: "",
    })

    // Validate form
    if (!validateAIForm()) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todos los campos del formulario estructurado correctamente",
        variant: "destructive",
      })
      return
    }

    // Check limits - include file count in token calculation
    const tokensNeeded = 50 + (attachedFiles.length * 10)
    if (!checkLimits("tokens", tokensNeeded)) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de tokens. Actualiza a Premium para continuar.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationLog([])
    setShowPreview(true)

    try {
      // Step 1: Starting
      setGenerationLog([getMessageForStep("starting")])
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 2: Analyzing
      setGenerationLog((prev) => [...prev, getMessageForStep("analyzing")])
      await new Promise((resolve) => setTimeout(resolve, 500))

      const structuredPrompt: StructuredPrompt = {
        objective,
        role,
        context,
        constraints,
      }

      // Step 3: Creating structure
      setGenerationLog((prev) => [...prev, getMessageForStep("creating_structure")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 4: Generating objectives
      setGenerationLog((prev) => [...prev, getMessageForStep("generating_objectives")])

      // Generate with Gemini (with files support and progress callback)
      const result = await generateProjectWithGemini(
        structuredPrompt,
        attachedFiles.length > 0 ? attachedFiles : undefined,
        (message) => {
          // Show OCR progress messages
          if (message.includes('📄') || message.includes('✅') || message.includes('⚠️')) {
            setGenerationLog((prev) => [...prev, message])
          }
        }
      )

      // Step 5: Creating timeline
      setGenerationLog((prev) => [...prev, getMessageForStep("creating_timeline")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 6: Generating backlog
      setGenerationLog((prev) => [...prev, getMessageForStep("generating_backlog")])
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 7: Applying US
      setGenerationLog((prev) => [...prev, getMessageForStep("applying_us")])
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Step 8: Creating sprints
      setGenerationLog((prev) => [...prev, getMessageForStep("creating_sprints")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 9: Assigning roles
      setGenerationLog((prev) => [...prev, getMessageForStep("assigning_roles")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 10: Creating project
      setGenerationLog((prev) => [...prev, getMessageForStep("creating_project")])

      // Save project to backend
      const projectData = {
        name: result.projectName,
        description: result.description,
        objectives: result.objectives,
        timeline: result.timeline,
        members: [user?.id],
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        status: "active",
        aiGenerated: true,
        structuredPrompt,
      }

      const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      const createdProject = await projectResponse.json()

      // Step 11: Saving backlog
      setGenerationLog((prev) => [...prev, getMessageForStep("saving_backlog")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Save product backlog items as individual user stories and collect IDs
      const userStoryIds: string[] = []
      const allCreatedTasks: any[] = []
      
      if (result.productBacklog && result.productBacklog.length > 0) {
        for (const backlogItem of result.productBacklog) {
          // Save as individual user story - let backend generate ID
          const userStoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: backlogItem.title,
              description: backlogItem.description,
              priority: backlogItem.priority,
              storyPoints: backlogItem.storyPoints,
              acceptanceCriteria: backlogItem.acceptanceCriteria || [],
              projectId: createdProject.id,
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              status: "todo",
              aiGenerated: true,
            }),
          })
          
          const createdUserStory = await userStoryResponse.json()
          userStoryIds.push(createdUserStory.id)
        }

        // Step 12: Creating tasks for each user story
        setGenerationLog((prev) => [...prev, getMessageForStep("creating_tasks")])
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Generate tasks for each user story
        for (let i = 0; i < result.productBacklog.length; i++) {
          const backlogItem = result.productBacklog[i]
          const userStoryId = userStoryIds[i]
          
          // Generate tasks based on user story complexity and type
          const tasksForStory = [
            {
              title: `Diseñar UI para ${backlogItem.title}`,
              description: `Crear mockups y diseño de interfaz para: ${backlogItem.description}`,
              userStoryId: userStoryId,
              projectId: createdProject.id,
              assignedTo: null, // Sin asignar por defecto
              status: "todo",
              priority: backlogItem.priority,
              estimatedHours: Math.max(2, Math.floor(backlogItem.storyPoints * 0.5)),
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              aiGenerated: true,
            },
            {
              title: `Implementar backend para ${backlogItem.title}`,
              description: `Desarrollar lógica de negocio y APIs para: ${backlogItem.description}`,
              userStoryId: userStoryId,
              projectId: createdProject.id,
              assignedTo: null,
              status: "todo",
              priority: backlogItem.priority,
              estimatedHours: Math.max(4, Math.floor(backlogItem.storyPoints * 0.8)),
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              aiGenerated: true,
            },
            {
              title: `Implementar frontend para ${backlogItem.title}`,
              description: `Desarrollar componentes y vistas para: ${backlogItem.description}`,
              userStoryId: userStoryId,
              projectId: createdProject.id,
              assignedTo: null,
              status: "todo",
              priority: backlogItem.priority,
              estimatedHours: Math.max(3, Math.floor(backlogItem.storyPoints * 0.6)),
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              aiGenerated: true,
            },
            {
              title: `Testing para ${backlogItem.title}`,
              description: `Pruebas unitarias e integración para: ${backlogItem.description}`,
              userStoryId: userStoryId,
              projectId: createdProject.id,
              assignedTo: null,
              status: "todo",
              priority: backlogItem.priority,
              estimatedHours: Math.max(2, Math.floor(backlogItem.storyPoints * 0.4)),
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              aiGenerated: true,
            },
          ]

          // Create tasks for this user story
          for (const task of tasksForStory) {
            try {
              const taskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(task),
              })
              
              if (taskResponse.ok) {
                const createdTask = await taskResponse.json()
                allCreatedTasks.push(createdTask)
              }
            } catch (error) {
              console.error(`Error creating task: ${task.title}`, error)
            }
          }
        }

        // Create a backlog container with references to all user stories
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: createdProject.id,
            type: "product",
            items: userStoryIds,
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            status: "active",
          }),
        })
      }

      // Step 13: Finalizing
      setGenerationLog((prev) => [...prev, getMessageForStep("finalizing")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      setGeneratedProject(result)
      setGenerationLog((prev) => [...prev, getMessageForStep("success")])

      // Update token usage
      await updateUsage("tokens", tokensNeeded)

      toast({
        title: "Proyecto generado con IA",
        description: `${result.projectName} creado con ${result.productBacklog?.length || 0} user stories y ${allCreatedTasks.length} tareas`,
      })

      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onProjectCreated()
      }, 2000)
    } catch (error) {
      console.error("❌ Error generating project with Gemini:", error)
      
      // Get error message
      let errorMessage = "Error desconocido"
      let errorTitle = "Error al generar proyecto"
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error("📋 Error message:", errorMessage)
        console.error("📋 Error stack:", error.stack)
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Check for specific error types
      if (errorMessage.includes("API key")) {
        errorTitle = "Error de configuración"
        errorMessage = "API key de Gemini no configurada correctamente"
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        errorTitle = "Error de conexión"
        errorMessage = "No se pudo conectar con el servicio de IA"
      } else if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
        errorTitle = "Límite alcanzado"
        errorMessage = "Has alcanzado el límite de uso de la API"
      }
      
      setGenerationLog((prev) => [
        ...prev,
        getMessageForStep("error"),
        `⚠️ ${errorMessage}`,
      ])
      
      // Show user-friendly error with better styling
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setStartDate(undefined)
    setEndDate(undefined)
    setObjective("")
    setRole("")
    setContext("")
    setConstraints("")
    setErrors({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    })
    setAiErrors({
      objective: "",
      role: "",
      context: "",
      constraints: "",
    })
    clearAllFiles()
    setGenerationLog([])
    setGeneratedProject(null)
    setShowPreview(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>Crea un proyecto manualmente o genera uno con IA</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-2 h-4 w-4" />
              Con IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del Proyecto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="E-commerce Platform"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: "" }))
                    }
                  }}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el proyecto..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: "" }))
                    }
                  }}
                  rows={4}
                  className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.description && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.description}</span>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Fecha de Inicio <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                          errors.startDate && "border-destructive focus-visible:ring-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          if (errors.startDate) {
                            setErrors(prev => ({ ...prev, startDate: "" }))
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.startDate}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    Fecha de Fin <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                          errors.endDate && "border-destructive focus-visible:ring-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          if (errors.endDate) {
                            setErrors(prev => ({ ...prev, endDate: "" }))
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.endDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Proyecto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="ai">
            {!showPreview ? (
              <form onSubmit={handleAIGenerate} className="space-y-2.5">
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-muted/50 p-2.5 border border-border">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Formulario Estructurado para IA</h4>
                        <p className="text-xs text-muted-foreground">
                          Completa los campos para que Gemini AI genere un proyecto optimizado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de 2 columnas para layout horizontal */}
                  <div className="grid grid-cols-2 gap-3">{/* Reducido de gap-4 a gap-3 */}
                    {/* Columna Izquierda */}
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="objective" className="text-sm">
                          Objetivo <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="objective"
                          placeholder="Ejemplo: Desarrollar una plataforma de e-commerce que permita a pequeños comerciantes vender sus productos en línea"
                          value={objective}
                          onChange={(e) => {
                            setObjective(e.target.value)
                            if (aiErrors.objective) {
                              setAiErrors(prev => ({ ...prev, objective: "" }))
                            }
                          }}
                          rows={2}
                          className={`text-sm resize-none ${aiErrors.objective ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {aiErrors.objective && (
                          <div className="flex items-center gap-2 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>{aiErrors.objective}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">¿Qué quieres lograr con este proyecto?</p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="context" className="text-sm">
                          Contexto <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="context"
                          placeholder="Ejemplo: El proyecto se desarrollará con un equipo de 5 personas (2 developers, 1 designer, 1 QA, 1 PO). Tecnologías: React, Node.js, PostgreSQL. Duración estimada: 3 meses"
                          value={context}
                          onChange={(e) => {
                            setContext(e.target.value)
                            if (aiErrors.context) {
                              setAiErrors(prev => ({ ...prev, context: "" }))
                            }
                          }}
                          rows={3}
                          className={`text-sm resize-none ${aiErrors.context ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {aiErrors.context && (
                          <div className="flex items-center gap-2 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>{aiErrors.context}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Proporciona contexto sobre el equipo, tecnologías y duración
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="role" className="text-sm">
                          Rol del Usuario <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="role"
                          placeholder="Ejemplo: Scrum Master, Product Owner, Tech Lead"
                          value={role}
                          onChange={(e) => {
                            setRole(e.target.value)
                            if (aiErrors.role) {
                              setAiErrors(prev => ({ ...prev, role: "" }))
                            }
                          }}
                          className={`text-sm ${aiErrors.role ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {aiErrors.role && (
                          <div className="flex items-center gap-2 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>{aiErrors.role}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">¿Cuál es tu rol en el proyecto?</p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="constraints" className="text-sm">
                          Restricciones y Límites <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="constraints"
                          placeholder="Ejemplo: Presupuesto limitado ($50k), debe lanzarse antes del Q4, cumplir con GDPR, soportar 1000 usuarios concurrentes"
                          value={constraints}
                          onChange={(e) => {
                            setConstraints(e.target.value)
                            if (aiErrors.constraints) {
                              setAiErrors(prev => ({ ...prev, constraints: "" }))
                            }
                          }}
                          rows={4}
                          className={`text-sm resize-none ${aiErrors.constraints ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {aiErrors.constraints && (
                          <div className="flex items-center gap-2 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>{aiErrors.constraints}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">¿Qué limitaciones o restricciones existen?</p>
                      </div>
                    </div>
                  </div>

                  {/* File attachment section - compacto */}
                  <div className="space-y-1.5">
                    <Label htmlFor="file-upload" className="text-sm">
                      Adjuntar Archivos <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    
                    {/* Hidden file inputs */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'image')}
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      id="document-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'document')}
                    />
                    
                    {/* Dropdown menu for file attachment */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={attachedFiles.length >= 10}
                          className="w-full relative text-sm h-9"
                        >
                          <Paperclip className="mr-2 h-3.5 w-3.5" />
                          {attachedFiles.length > 0 ? `${attachedFiles.length} archivo(s)` : "Adjuntar archivos"}
                          {attachedFiles.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs h-5">{attachedFiles.length}</Badge>
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
                    
                    {attachedFiles.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{attachedFiles.length} archivo(s)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFiles}
                            className="h-6 text-xs"
                          >
                            Limpiar
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto">
                          {attachedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="relative border rounded p-1.5 bg-muted/50">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0.5 right-0.5 h-5 w-5"
                                onClick={() => handleRemoveFile(file)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <div className="flex items-center gap-1.5 pr-6">
                                {file.type.startsWith('image/') ? (
                                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-xs truncate flex-1">{file.name}</span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      📷 📄 Gemini AI puede extraer texto de imágenes y documentos. Max 10 archivos, 20MB c/u.
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      💡 Esta generación consumirá <strong>{50 + (attachedFiles.length * 10)} tokens</strong>. Gemini AI creará objetivos SMART,
                      timeline, backlog y estructura completa{attachedFiles.length > 0 ? ` usando ${attachedFiles.length} archivo(s)` : ""}.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isGenerating} className="bg-primary hover:bg-primary/90">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Generación en Tiempo Real</h4>
                    </div>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {generationLog.map((log, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 rounded bg-muted/50 animate-in slide-in-from-bottom-2 duration-300"
                          >
                            {log}
                          </div>
                        ))}
                        {isGenerating && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Procesando AI...</span>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {!isGenerating && generatedProject && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Proyecto generado exitosamente</span>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false)
                      setGenerationLog([])
                    }}
                    disabled={isGenerating}
                  >
                    Volver
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
