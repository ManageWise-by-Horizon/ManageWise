"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createApiUrl } from "@/lib/api-config"

interface CreateSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: any[]
  onSprintCreated: () => void
}

export function CreateSprintDialog({ open, onOpenChange, projects, onSprintCreated }: CreateSprintDialogProps) {
  const { user, checkLimits, updateUsage } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const [projectId, setProjectId] = useState("")
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userStories, setUserStories] = useState<any[]>([])
  const [selectedStories, setSelectedStories] = useState<string[]>([])

  useEffect(() => {
    if (projectId && open) {
      fetchUserStories()
    }
  }, [projectId, open])

  const fetchUserStories = async () => {
    try {
      const response = await fetch(createApiUrl(`/userStories?projectId=${projectId}`))
      const data = await response.json()
      setUserStories(data.filter((s: any) => s.status === "todo"))
    } catch (error) {
      console.error("[v0] Error fetching user stories:", error)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectId || selectedStories.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un proyecto y al menos una user story",
        variant: "destructive",
      })
      return
    }

    // Check limits
    if (!checkLimits("tokens", 25)) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de tokens. Actualiza a Premium para continuar.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Fetch team members for task assignment
      const projectRes = await fetch(createApiUrl(`/projects/${projectId}`))
      const project = await projectRes.json()

      const usersRes = await fetch(createApiUrl('/users'))
      const allUsers = await usersRes.json()
      const teamMembers = allUsers.filter((u: any) => project.members.includes(u.id))

      // Helper function: Generar tareas para una user story con asignación AI
      const generateTasksForStory = (storyId: string, story: any) => {
        const taskTemplates = [
          {
            title: `Diseñar UI para ${story.title}`,
            description: `Crear mockups y diseño de interfaz`,
            assignedTo: teamMembers.find((m: any) => m.role === "developer")?.id || teamMembers[0]?.id,
            estimatedHours: 4,
          },
          {
            title: `Implementar backend para ${story.title}`,
            description: `Desarrollar lógica de negocio y APIs`,
            assignedTo: teamMembers.find((m: any) => m.role === "developer")?.id || teamMembers[0]?.id,
            estimatedHours: 8,
          },
          {
            title: `Implementar frontend para ${story.title}`,
            description: `Desarrollar componentes y vistas`,
            assignedTo: teamMembers.find((m: any) => m.role === "developer")?.id || teamMembers[1]?.id,
            estimatedHours: 6,
          },
          {
            title: `Testing para ${story.title}`,
            description: `Pruebas unitarias e integración`,
            assignedTo: teamMembers[teamMembers.length - 1]?.id,
            estimatedHours: 3,
          },
        ]

        return taskTemplates.map(template => ({
          ...template,
          userStoryId: storyId,
          status: "todo",
          priority: story.priority,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiAssigned: true,
        }))
      }

      // Generate tasks for each selected user story with AI assignment
      const allTasks = []
      for (const storyId of selectedStories) {
        const story = userStories.find((s) => s.id === storyId)
        if (!story) continue

        allTasks.push(...generateTasksForStory(storyId, story))
      }

      // Create tasks with validation
      const createdTasks = await Promise.all(
        allTasks.map(async (task) => {
          // Validate required fields before creating
          if (!task.userStoryId) {
            throw new Error(`Task "${task.title}" missing userStoryId`)
          }
          if (task.status !== "todo") {
            task.status = "todo" // Force correct status
          }

          const response = await fetch(createApiUrl('/tasks'), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          })
          
          if (!response.ok) {
            throw new Error(`Failed to create task: ${task.title}`)
          }
          
          return response.json()
        }),
      )

      // Create sprint
      const newSprint = {
        name,
        projectId,
        startDate,
        endDate,
        goal,
        userStories: selectedStories,
        tasks: createdTasks.map((t) => t.id),
        status: "planning",
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
      }

      await fetch(createApiUrl('/sprints'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSprint),
      })

      // Update token usage
      await updateUsage("tokens", 25)

      toast({
        title: "Sprint generado con IA",
        description: `Se crearon ${createdTasks.length} tareas con asignación automática basada en habilidades`,
      })

      resetForm()
      onOpenChange(false)
      onSprintCreated()
    } catch (error) {
      console.error("[v0] Error generating sprint with AI:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el sprint con IA",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setProjectId("")
    setName("")
    setGoal("")
    setStartDate("")
    setEndDate("")
    setSelectedStories([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Sprint con IA</DialogTitle>
          <DialogDescription>
            La IA creará y asignará tareas automáticamente basándose en las hojas de vida
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAIGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Proyecto</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger id="project">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Sprint</Label>
            <Input id="name" placeholder="Sprint 1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo del Sprint</Label>
            <Textarea
              id="goal"
              placeholder="Implementar autenticación y dashboard básico"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              rows={3}
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
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          {projectId && userStories.length > 0 && (
            <div className="space-y-2">
              <Label>User Stories a incluir</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {userStories.map((story) => (
                  <div key={story.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedStories.includes(story.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStories([...selectedStories, story.id])
                        } else {
                          setSelectedStories(selectedStories.filter((id) => id !== story.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{story.title}</p>
                      <p className="text-xs text-muted-foreground">{story.storyPoints} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            La IA descompondrá las user stories en tareas y las asignará automáticamente según las habilidades del
            equipo (25 tokens)
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isGenerating} className="bg-chart-1 hover:bg-chart-1/90">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Sprint
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
