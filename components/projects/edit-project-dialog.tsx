"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  Loader2,
  Plus,
  X,
  Wand2,
  FileText,
  Target,
  Settings2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateProjectWithGemini } from "@/lib/gemini"

interface Project {
  id: string
  name: string
  description: string
  objectives: string[]
  timeline: {
    start?: string
    end?: string
    startDate?: string
    estimatedEndDate?: string
  }
  members: string[]
  createdBy: string
  createdAt: string
  status: string
  structuredPrompt?: {
    objective: string
    role: string
    context: string
    constraints: string
  }
}

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  onProjectUpdated?: () => void
}

interface ValidationErrors {
  name?: string
  description?: string
  objectives?: string
  startDate?: string
  estimatedEndDate?: string
  aiPrompt?: string
  role?: string
  context?: string
  constraints?: string
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados del formulario
  const [activeTab, setActiveTab] = useState("manual")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  // Estados del modo manual
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [objectives, setObjectives] = useState<string[]>([])
  const [newObjective, setNewObjective] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [estimatedEndDate, setEstimatedEndDate] = useState<Date>()
  
  // Estados del modo AI
  const [aiPrompt, setAiPrompt] = useState("")
  const [role, setRole] = useState("")
  const [context, setContext] = useState("")
  const [constraints, setConstraints] = useState("")

  // Cargar datos del proyecto al abrir el diálogo
  useEffect(() => {
    if (open && project) {
      setName(project.name)
      setDescription(project.description)
      setObjectives([...project.objectives])
      
      // Cargar fechas
      if (project.timeline.startDate || project.timeline.start) {
        setStartDate(new Date(project.timeline.startDate || project.timeline.start || ""))
      }
      if (project.timeline.estimatedEndDate || project.timeline.end) {
        setEstimatedEndDate(new Date(project.timeline.estimatedEndDate || project.timeline.end || ""))
      }
      
      // Cargar datos de AI si existen
      if (project.structuredPrompt) {
        setRole(project.structuredPrompt.role)
        setContext(project.structuredPrompt.context)
        setConstraints(project.structuredPrompt.constraints)
        setAiPrompt(project.structuredPrompt.objective)
      }
      
      // Limpiar errores
      setErrors({})
    }
  }, [open, project])

  const clearError = (field: keyof ValidationErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateManualForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validar nombre
    if (!name.trim()) {
      newErrors.name = "El nombre del proyecto es obligatorio"
    } else if (name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
    } else if (name.trim().length > 100) {
      newErrors.name = "El nombre no puede exceder 100 caracteres"
    }

    // Validar descripción
    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    } else if (description.trim().length < 10) {
      newErrors.description = "La descripción debe tener al menos 10 caracteres"
    } else if (description.trim().length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres"
    }

    // Validar objetivos
    if (objectives.length === 0) {
      newErrors.objectives = "Debe agregar al menos un objetivo"
    } else if (objectives.some(obj => obj.trim().length < 5)) {
      newErrors.objectives = "Cada objetivo debe tener al menos 5 caracteres"
    }

    // Validar fechas
    if (!startDate) {
      newErrors.startDate = "La fecha de inicio es obligatoria"
    }

    if (!estimatedEndDate) {
      newErrors.estimatedEndDate = "La fecha estimada de fin es obligatoria"
    } else if (startDate && estimatedEndDate <= startDate) {
      newErrors.estimatedEndDate = "La fecha de fin debe ser posterior a la de inicio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAIForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validar prompt de AI
    if (!aiPrompt.trim()) {
      newErrors.aiPrompt = "El prompt del proyecto es obligatorio"
    } else if (aiPrompt.trim().length < 20) {
      newErrors.aiPrompt = "El prompt debe tener al menos 20 caracteres"
    } else if (aiPrompt.trim().length > 500) {
      newErrors.aiPrompt = "El prompt no puede exceder 500 caracteres"
    }

    // Validar rol
    if (!role.trim()) {
      newErrors.role = "El rol es obligatorio"
    } else if (role.trim().length < 5) {
      newErrors.role = "El rol debe tener al menos 5 caracteres"
    }

    // Validar contexto
    if (!context.trim()) {
      newErrors.context = "El contexto es obligatorio"
    } else if (context.trim().length < 10) {
      newErrors.context = "El contexto debe tener al menos 10 caracteres"
    }

    // Validar restricciones
    if (!constraints.trim()) {
      newErrors.constraints = "Las restricciones son obligatorias"
    } else if (constraints.trim().length < 10) {
      newErrors.constraints = "Las restricciones deben tener al menos 10 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addObjective = () => {
    if (newObjective.trim() && !objectives.includes(newObjective.trim())) {
      setObjectives([...objectives, newObjective.trim()])
      setNewObjective("")
      clearError("objectives")
    }
  }

  const removeObjective = (index: number) => {
    const updated = objectives.filter((_, i) => i !== index)
    setObjectives(updated)
    if (updated.length === 0) {
      setErrors(prev => ({ ...prev, objectives: "Debe agregar al menos un objetivo" }))
    }
  }

  const handleGenerateWithAI = async () => {
    if (!validateAIForm()) return

    setIsLoading(true)
    try {
      console.log("[AI] Generando proyecto con los siguientes parámetros:")
      console.log("  - Objetivo:", aiPrompt)
      console.log("  - Rol:", role)
      console.log("  - Contexto:", context)
      console.log("  - Restricciones:", constraints)

      const structuredPrompt = {
        objective: aiPrompt.trim(),
        role: role.trim(),
        context: context.trim(),
        constraints: constraints.trim(),
      }

      const generatedProject = await generateProjectWithGemini(structuredPrompt)

      // Aplicar los datos generados al formulario manual
      setName(generatedProject.name)
      setDescription(generatedProject.description)
      setObjectives(generatedProject.objectives)
      
      if (generatedProject.timeline?.startDate) {
        setStartDate(new Date(generatedProject.timeline.startDate))
      }
      if (generatedProject.timeline?.estimatedEndDate) {
        setEstimatedEndDate(new Date(generatedProject.timeline.estimatedEndDate))
      }

      // Cambiar a la pestaña manual para mostrar los resultados
      setActiveTab("manual")
      
      toast({
        title: "¡Proyecto generado con IA!",
        description: "Revisa y ajusta los datos generados antes de guardar.",
      })

    } catch (error) {
      console.error("[AI] Error generando proyecto:", error)
      
      let errorTitle = "Error de generación"
      let errorDescription = "No se pudo generar el proyecto con IA. Intenta nuevamente."
      
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorTitle = "Error de configuración"
          errorDescription = "La API key de Gemini no está configurada correctamente."
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
          errorTitle = "Límite alcanzado"
          errorDescription = "Se alcanzó el límite de la API. Intenta más tarde."
        } else {
          errorDescription = error.message
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!validateManualForm()) return

    setIsLoading(true)
    try {
      const updatedProject = {
        ...project,
        name: name.trim(),
        description: description.trim(),
        objectives: objectives,
        timeline: {
          startDate: startDate?.toISOString(),
          estimatedEndDate: estimatedEndDate?.toISOString(),
        },
        structuredPrompt: activeTab === "ai" ? {
          objective: aiPrompt.trim(),
          role: role.trim(),
          context: context.trim(),
          constraints: constraints.trim(),
        } : project.structuredPrompt,
      }

      console.log("[EDIT] Actualizando proyecto:", updatedProject.id)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProject),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el proyecto")
      }

      toast({
        title: "✅ Proyecto actualizado",
        description: `"${name}" ha sido actualizado exitosamente.`,
      })

      onOpenChange(false)
      onProjectUpdated?.()

    } catch (error) {
      console.error("[EDIT] Error actualizando proyecto:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    if (project) {
      setName(project.name)
      setDescription(project.description)
      setObjectives([...project.objectives])
      
      if (project.timeline.startDate || project.timeline.start) {
        setStartDate(new Date(project.timeline.startDate || project.timeline.start || ""))
      }
      if (project.timeline.estimatedEndDate || project.timeline.end) {
        setEstimatedEndDate(new Date(project.timeline.estimatedEndDate || project.timeline.end || ""))
      }
      
      if (project.structuredPrompt) {
        setRole(project.structuredPrompt.role)
        setContext(project.structuredPrompt.context)
        setConstraints(project.structuredPrompt.constraints)
        setAiPrompt(project.structuredPrompt.objective)
      } else {
        setRole("")
        setContext("")
        setConstraints("")
        setAiPrompt("")
      }
    }
    setNewObjective("")
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-6xl !w-[95vw] max-h-[95vh] overflow-y-auto p-6 sm:!max-w-6xl"
        style={{ 
          maxWidth: '1152px', 
          width: '95vw',
          minWidth: '800px'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Editar Proyecto
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del proyecto "{project?.name}". Puedes usar IA para regenerar el contenido o editarlo manualmente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Edición Manual
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Regenerar con IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Nombre del proyecto */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input
                id="name"
                placeholder="Ej: Sistema de Gestión de Inventario"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearError("name")
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el propósito y alcance del proyecto..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  clearError("description")
                }}
                className={errors.description ? "border-destructive" : ""}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Objetivos */}
            <div className="space-y-2">
              <Label>Objetivos del Proyecto</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar nuevo objetivo..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addObjective()}
                />
                <Button type="button" variant="outline" size="icon" onClick={addObjective}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {objectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Target className="h-3 w-3" />
                      {objective}
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {errors.objectives && (
                <p className="text-sm text-destructive">{errors.objectives}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                        errors.startDate && "border-destructive"
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
                        clearError("startDate")
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha Estimada de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !estimatedEndDate && "text-muted-foreground",
                        errors.estimatedEndDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {estimatedEndDate ? format(estimatedEndDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={estimatedEndDate}
                      onSelect={(date) => {
                        setEstimatedEndDate(date)
                        clearError("estimatedEndDate")
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.estimatedEndDate && (
                  <p className="text-sm text-destructive">{errors.estimatedEndDate}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <Alert>
              <Wand2 className="h-4 w-4" />
              <AlertDescription>
                Usa IA para regenerar los detalles del proyecto. Los datos actuales se sobrescribirán con la nueva generación.
              </AlertDescription>
            </Alert>

            {/* Prompt principal */}
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Objetivo del Proyecto</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Describe el objetivo principal del proyecto que quieres regenerar..."
                value={aiPrompt}
                onChange={(e) => {
                  setAiPrompt(e.target.value)
                  clearError("aiPrompt")
                }}
                className={errors.aiPrompt ? "border-destructive" : ""}
                rows={3}
              />
              {errors.aiPrompt && (
                <p className="text-sm text-destructive">{errors.aiPrompt}</p>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="role">Tu Rol en el Proyecto</Label>
              <Input
                id="role"
                placeholder="Ej: Product Manager, Desarrollador Senior, Scrum Master"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  clearError("role")
                }}
                className={errors.role ? "border-destructive" : ""}
              />
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Contexto */}
            <div className="space-y-2">
              <Label htmlFor="context">Contexto y Antecedentes</Label>
              <Textarea
                id="context"
                placeholder="Proporciona contexto sobre la situación actual, problema a resolver, etc..."
                value={context}
                onChange={(e) => {
                  setContext(e.target.value)
                  clearError("context")
                }}
                className={errors.context ? "border-destructive" : ""}
                rows={3}
              />
              {errors.context && (
                <p className="text-sm text-destructive">{errors.context}</p>
              )}
            </div>

            {/* Restricciones */}
            <div className="space-y-2">
              <Label htmlFor="constraints">Restricciones y Limitaciones</Label>
              <Textarea
                id="constraints"
                placeholder="Menciona limitaciones de tiempo, presupuesto, tecnología, recursos, etc..."
                value={constraints}
                onChange={(e) => {
                  setConstraints(e.target.value)
                  clearError("constraints")
                }}
                className={errors.constraints ? "border-destructive" : ""}
                rows={3}
              />
              {errors.constraints && (
                <p className="text-sm text-destructive">{errors.constraints}</p>
              )}
            </div>

            <Button 
              onClick={handleGenerateWithAI} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerando con IA...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Regenerar Proyecto con IA
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveProject} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}