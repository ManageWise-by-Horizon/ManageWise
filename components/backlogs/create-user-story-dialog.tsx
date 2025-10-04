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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"

interface CreateUserStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backlogId: string
  projectId: string
  onStoryCreated: () => void
}

export function CreateUserStoryDialog({
  open,
  onOpenChange,
  backlogId,
  projectId,
  onStoryCreated,
}: CreateUserStoryDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [storyPoints, setStoryPoints] = useState("5")
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([""])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newStory = {
        title,
        description,
        acceptanceCriteria: acceptanceCriteria.filter((c) => c.trim() !== ""),
        priority,
        storyPoints: Number.parseInt(storyPoints),
        status: "todo",
        projectId,
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        aiGenerated: false,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStory),
      })

      const createdStory = await response.json()

      // Update backlog items
      const backlogRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${backlogId}`)
      const backlog = await backlogRes.json()

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${backlogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [...backlog.items, createdStory.id],
        }),
      })

      toast({
        title: "User Story creada",
        description: "La user story ha sido creada exitosamente",
      })

      resetForm()
      onOpenChange(false)
      onStoryCreated()
    } catch (error) {
      console.error("[v0] Error creating user story:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la user story",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setStoryPoints("5")
    setAcceptanceCriteria([""])
  }

  const addCriteria = () => {
    setAcceptanceCriteria([...acceptanceCriteria, ""])
  }

  const removeCriteria = (index: number) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index))
  }

  const updateCriteria = (index: number, value: string) => {
    const updated = [...acceptanceCriteria]
    updated[index] = value
    setAcceptanceCriteria(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear User Story</DialogTitle>
          <DialogDescription>Crea una nueva user story manualmente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Autenticación de usuarios"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Como/Quiero/Para)</Label>
            <Textarea
              id="description"
              placeholder="Como usuario, quiero poder registrarme e iniciar sesión para acceder a mi cuenta"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)} required>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Select value={storyPoints} onValueChange={setStoryPoints} required>
                <SelectTrigger id="storyPoints">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="13">13</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Criterios de Aceptación</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {acceptanceCriteria.map((criteria, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Criterio ${index + 1}`}
                    value={criteria}
                    onChange={(e) => updateCriteria(index, e.target.value)}
                  />
                  {acceptanceCriteria.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCriteria(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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
                "Crear User Story"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
