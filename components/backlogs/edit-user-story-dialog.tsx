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
import { Loader2, Plus, X } from "lucide-react"
import { userStoryService } from "@/lib/domain/user-stories/services/user-story.service"
import type { UserStory } from "@/lib/domain/user-stories/types/user-story.types"

interface EditUserStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userStory: UserStory | null
  onStoryUpdated: () => void
}

export function EditUserStoryDialog({
  open,
  onOpenChange,
  userStory,
  onStoryUpdated,
}: EditUserStoryDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [storyPoints, setStoryPoints] = useState("5")
  const [priority, setPriority] = useState<"ALTA" | "MEDIA" | "BAJA">("MEDIA")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED">("TODO")
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([""])

  // Cargar datos de la user story cuando se abre el diálogo
  useEffect(() => {
    if (open && userStory) {
      setTitle(userStory.title || "")
      setDescription(userStory.description || "")
      setStoryPoints(String(userStory.storyPoints || 5))
      setPriority((userStory.priority?.toUpperCase() as "ALTA" | "MEDIA" | "BAJA") || "MEDIA")
      setStatus((userStory.status?.toUpperCase() as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED") || "TODO")
      setAcceptanceCriteria(
        userStory.acceptanceCriteria && userStory.acceptanceCriteria.length > 0
          ? userStory.acceptanceCriteria
          : [""]
      )
    }
  }, [open, userStory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!userStory?.id) {
        throw new Error('La user story no tiene un ID válido')
      }

      if (!user?.id) {
        throw new Error('Debes estar autenticado para editar user stories')
      }

      console.log('[EditUserStoryDialog] Updating user story with:', {
        id: userStory.id,
        title,
        storyPoints: Number.parseInt(storyPoints),
        priority,
        status
      })

      // Usar el servicio DDD - el backend espera los campos actualizados
      const updatedStory = await userStoryService.updateUserStory(userStory.id, {
        title,
        description,
        acceptanceCriteria: acceptanceCriteria.filter((c) => c.trim() !== ""),
        storyPoints: Number.parseInt(storyPoints),
        priority: priority,
        status: status,
      })

      toast({
        title: "User Story actualizada",
        description: "La user story ha sido actualizada exitosamente",
      })

      onOpenChange(false)
      onStoryUpdated()
    } catch (error) {
      console.error("Error updating user story:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar la user story"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    if (userStory) {
      setTitle(userStory.title || "")
      setDescription(userStory.description || "")
      setStoryPoints(String(userStory.storyPoints || 5))
      setPriority((userStory.priority?.toUpperCase() as "ALTA" | "MEDIA" | "BAJA") || "MEDIA")
      setStatus((userStory.status?.toUpperCase() as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED") || "TODO")
      setAcceptanceCriteria(
        userStory.acceptanceCriteria && userStory.acceptanceCriteria.length > 0
          ? userStory.acceptanceCriteria
          : [""]
      )
    }
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

  if (!userStory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar User Story</DialogTitle>
          <DialogDescription>Edita los detalles de la user story</DialogDescription>
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

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value: "ALTA" | "MEDIA" | "BAJA") => setPriority(value)} required>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(value: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED") => setStatus(value)} required>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">Por Hacer</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="DONE">Completado</SelectItem>
                <SelectItem value="BLOCKED">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
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
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

