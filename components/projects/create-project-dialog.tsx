"use client"

import type React from "react"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Bot, CheckCircle2, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateProjectWithGemini, type StructuredPrompt } from "@/lib/gemini"
import { getMessageForStep } from "@/lib/generation-messages"

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
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // AI Structured form
  const [objective, setObjective] = useState("")
  const [role, setRole] = useState("")
  const [context, setContext] = useState("")
  const [constraints, setConstraints] = useState("")

  // AI Generation state
  const [generationLog, setGenerationLog] = useState<string[]>([])
  const [generatedProject, setGeneratedProject] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newProject = {
        name,
        description,
        objectives: [],
        timeline: {
          start: startDate,
          end: endDate,
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
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente",
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

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!objective || !role || !context || !constraints) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos del formulario estructurado.",
        variant: "destructive",
      })
      return
    }

    // Check limits
    if (!checkLimits("tokens", 50)) {
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

      // Generate with Gemini (silent, no chunk logging)
      const result = await generateProjectWithGemini(structuredPrompt)

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
      
      if (result.productBacklog && result.productBacklog.length > 0) {
        for (const backlogItem of result.productBacklog) {
          // Generate unique ID for each user story
          const userStoryId = Math.random().toString(36).substring(2, 6)
          userStoryIds.push(userStoryId)
          
          // Save as individual backlog item (user story)
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: userStoryId,
              title: backlogItem.title,
              description: backlogItem.description,
              priority: backlogItem.priority,
              storyPoints: backlogItem.storyPoints,
              acceptanceCriteria: backlogItem.acceptanceCriteria || [],
              projectId: createdProject.id,
              createdBy: user?.id,
              createdAt: new Date().toISOString(),
              status: "pending",
            }),
          })
        }

        // Create a backlog container with references to all user stories
        const backlogContainerId = Math.random().toString(36).substring(2, 6)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: backlogContainerId,
            projectId: createdProject.id,
            type: "product",
            items: userStoryIds,
            createdBy: user?.id,
            createdAt: new Date().toISOString(),
            status: "active",
          }),
        })
      }

      // Step 12: Finalizing
      setGenerationLog((prev) => [...prev, getMessageForStep("finalizing")])
      await new Promise((resolve) => setTimeout(resolve, 300))

      setGeneratedProject(result)
      setGenerationLog((prev) => [...prev, getMessageForStep("success")])

      // Update token usage
      await updateUsage("tokens", 50)

      toast({
        title: "Proyecto generado con IA",
        description: `${result.projectName} creado con ${result.productBacklog?.length || 0} user stories`,
      })

      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onProjectCreated()
      }, 2000)
    } catch (error) {
      console.error("Error generating project with Gemini:", error)
      setGenerationLog((prev) => [
        ...prev,
        getMessageForStep("error"),
        `Detalles: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ])
      toast({
        title: "Error",
        description: "No se pudo generar el proyecto con IA. Verifica tu conexión y API key.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setObjective("")
    setRole("")
    setContext("")
    setConstraints("")
    setGenerationLog([])
    setGeneratedProject(null)
    setShowPreview(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                <Label htmlFor="name">Nombre del Proyecto</Label>
                <Input
                  id="name"
                  placeholder="E-commerce Platform"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
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
              <form onSubmit={handleAIGenerate} className="space-y-4">
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4 border border-border">
                    <div className="flex items-start gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Formulario Estructurado para IA</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completa los campos para que Gemini AI genere un proyecto optimizado
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">
                      Objetivo <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="objective"
                      placeholder="Ejemplo: Desarrollar una plataforma de e-commerce que permita a pequeños comerciantes vender sus productos en línea"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      required
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">¿Qué quieres lograr con este proyecto?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Rol del Usuario <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="role"
                      placeholder="Ejemplo: Scrum Master, Product Owner, Tech Lead"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">¿Cuál es tu rol en el proyecto?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">
                      Contexto <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="context"
                      placeholder="Ejemplo: El proyecto se desarrollará con un equipo de 5 personas (2 developers, 1 designer, 1 QA, 1 PO). Tecnologías: React, Node.js, PostgreSQL. Duración estimada: 3 meses"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      required
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Proporciona contexto sobre el equipo, tecnologías y duración
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="constraints">
                      Restricciones y Límites <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="constraints"
                      placeholder="Ejemplo: Presupuesto limitado ($50k), debe lanzarse antes del Q4, cumplir con GDPR, soportar 1000 usuarios concurrentes"
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      required
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">¿Qué limitaciones o restricciones existen?</p>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      💡 Esta generación consumirá <strong>50 tokens</strong>. Gemini AI creará objetivos SMART,
                      timeline, backlog y estructura completa del proyecto.
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
