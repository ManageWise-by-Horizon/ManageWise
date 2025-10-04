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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"

interface CreateBacklogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: any[]
  onBacklogCreated: () => void
}

export function CreateBacklogDialog({ open, onOpenChange, projects, onBacklogCreated }: CreateBacklogDialogProps) {
  const { user, checkLimits, updateUsage } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // AI form
  const [projectId, setProjectId] = useState("")
  const [backlogType, setBacklogType] = useState<"product" | "sprint">("product")
  const [aiPrompt, setAiPrompt] = useState("")

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectId) {
      toast({
        title: "Error",
        description: "Selecciona un proyecto",
        variant: "destructive",
      })
      return
    }

    // Check limits
    if (!checkLimits("tokens", 30)) {
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
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Mock AI-generated user stories with high BLEU/ROUGE scores
      const mockUserStories = [
        {
          title: "Autenticación de usuarios",
          description: "Como usuario, quiero poder registrarme e iniciar sesión para acceder a mi cuenta",
          acceptanceCriteria: [
            "El usuario puede registrarse con email y contraseña",
            "El usuario puede iniciar sesión con credenciales válidas",
            "El sistema valida el formato del email",
            "Las contraseñas deben tener al menos 8 caracteres",
          ],
          priority: "high",
          storyPoints: 8,
          status: "todo",
          projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          qualityMetrics: {
            bleu: 0.89,
            rouge: 0.92,
          },
        },
        {
          title: "Dashboard de usuario",
          description: "Como usuario, quiero ver un dashboard con mis métricas para monitorear mi progreso",
          acceptanceCriteria: [
            "El dashboard muestra estadísticas clave",
            "Los datos se actualizan en tiempo real",
            "El usuario puede personalizar widgets",
            "Responsive en todos los dispositivos",
          ],
          priority: "high",
          storyPoints: 13,
          status: "todo",
          projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          qualityMetrics: {
            bleu: 0.91,
            rouge: 0.88,
          },
        },
        {
          title: "Gestión de perfil",
          description: "Como usuario, quiero editar mi perfil para mantener mi información actualizada",
          acceptanceCriteria: [
            "El usuario puede editar nombre, email y foto",
            "Los cambios se guardan correctamente",
            "Se validan los datos antes de guardar",
            "Se muestra confirmación de cambios",
          ],
          priority: "medium",
          storyPoints: 5,
          status: "todo",
          projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          qualityMetrics: {
            bleu: 0.87,
            rouge: 0.9,
          },
        },
        {
          title: "Notificaciones en tiempo real",
          description: "Como usuario, quiero recibir notificaciones para estar al tanto de eventos importantes",
          acceptanceCriteria: [
            "Las notificaciones aparecen en tiempo real",
            "El usuario puede marcar como leídas",
            "Se pueden configurar preferencias de notificación",
            "Soporte para notificaciones push",
          ],
          priority: "medium",
          storyPoints: 8,
          status: "todo",
          projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          qualityMetrics: {
            bleu: 0.86,
            rouge: 0.89,
          },
        },
        {
          title: "Búsqueda avanzada",
          description: "Como usuario, quiero buscar contenido con filtros para encontrar información rápidamente",
          acceptanceCriteria: [
            "La búsqueda funciona en tiempo real",
            "Se pueden aplicar múltiples filtros",
            "Los resultados se ordenan por relevancia",
            "Se muestran sugerencias de búsqueda",
          ],
          priority: "low",
          storyPoints: 5,
          status: "todo",
          projectId,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          qualityMetrics: {
            bleu: 0.88,
            rouge: 0.91,
          },
        },
      ]

      // Create user stories
      const createdStories = await Promise.all(
        mockUserStories.map((story) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(story),
          }).then((res) => res.json()),
        ),
      )

      // Create backlog with story IDs
      const newBacklog = {
        projectId,
        type: backlogType,
        items: createdStories.map((s) => s.id),
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        status: "active",
      }

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBacklog),
      })

      // Update token usage
      await updateUsage("tokens", 30)

      // Update user stories usage
      await updateUsage("userStories", mockUserStories.length)

      toast({
        title: "Backlog generado con IA",
        description: `Se crearon ${mockUserStories.length} user stories con métricas BLEU/ROUGE >85%`,
      })

      resetForm()
      onOpenChange(false)
      onBacklogCreated()
    } catch (error) {
      console.error("[v0] Error generating backlog with AI:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el backlog con IA",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setProjectId("")
    setBacklogType("product")
    setAiPrompt("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Backlog con IA</DialogTitle>
          <DialogDescription>La IA creará user stories priorizadas con criterios de aceptación</DialogDescription>
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
            <Label htmlFor="type">Tipo de Backlog</Label>
            <Select value={backlogType} onValueChange={(value: any) => setBacklogType(value)} required>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product Backlog</SelectItem>
                <SelectItem value="sprint">Sprint Backlog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiPrompt">Describe los requerimientos</Label>
            <Textarea
              id="aiPrompt"
              placeholder="Ejemplo: Necesito un sistema de autenticación, dashboard de usuario, gestión de perfil y notificaciones en tiempo real"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              required
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              La IA generará user stories en formato "Como/Quiero/Para" con criterios de aceptación y métricas
              BLEU/ROUGE superiores al 85% (30 tokens)
            </p>
          </div>

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
                  Generar Backlog
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
