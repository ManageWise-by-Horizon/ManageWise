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
import { Loader2, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  // AI form
  const [aiPrompt, setAiPrompt] = useState("")

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

    // Check limits
    if (!checkLimits("tokens", 20)) {
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

      // Mock AI response
      const aiGeneratedProject = {
        name: aiPrompt.split(" ").slice(0, 4).join(" "),
        description: `Proyecto generado por IA: ${aiPrompt}`,
        objectives: [
          "Definir alcance y requerimientos",
          "Diseñar arquitectura del sistema",
          "Implementar funcionalidades core",
          "Realizar pruebas y QA",
          "Desplegar a producción",
        ],
        timeline: {
          start: new Date().toISOString().split("T")[0],
          end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
        members: [user?.id],
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        status: "active",
      }

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiGeneratedProject),
      })

      // Update token usage
      await updateUsage("tokens", 20)

      toast({
        title: "Proyecto generado con IA",
        description: "El proyecto ha sido creado exitosamente con objetivos SMART",
      })

      resetForm()
      onOpenChange(false)
      onProjectCreated()
    } catch (error) {
      console.error("[v0] Error generating project with AI:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el proyecto con IA",
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
    setAiPrompt("")
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
            <form onSubmit={handleAIGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">Describe tu proyecto</Label>
                <Textarea
                  id="aiPrompt"
                  placeholder="Ejemplo: Crear una plataforma de e-commerce con sistema de pagos, gestión de inventario y panel de administración"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  required
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  La IA generará automáticamente objetivos SMART, timeline y estructura del proyecto (20 tokens)
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
                      Generar con IA
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
