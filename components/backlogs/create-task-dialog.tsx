"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { Loader2 } from "lucide-react"
import { taskService } from "@/lib/domain/tasks/services/task.service"
import { profileService } from "@/lib/domain/profile/services/profile.service"
import { projectService } from "@/lib/domain/projects/services/project.service"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userStoryId: string
  projectId: string
  onTaskCreated: () => void
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  userStoryId,
  projectId,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("3")
  const [priority, setPriority] = useState<"ALTA" | "MEDIA" | "BAJA">("MEDIA")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO")
  const [assignedTo, setAssignedTo] = useState<string>("")
  const [assignedToError, setAssignedToError] = useState<string>("")

  useEffect(() => {
    if (open && projectId) {
      fetchUsers()
    }
  }, [open, projectId])

  const fetchUsers = async () => {
    try {
      // Obtener el proyecto para obtener los miembros
      const project = await projectService.getProjectById(projectId)
      
      if (!project || !project.members || project.members.length === 0) {
        console.warn("No se encontraron miembros en el proyecto")
        setUsers([])
        return
      }

      // Obtener los perfiles de los miembros del proyecto
      const memberProfiles = await Promise.all(
        project.members.map(async (memberId: string) => {
          try {
            const profile = await profileService.getUserProfile({ userId: memberId })
            return {
              id: profile.userId,
              name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userEmail,
              email: profile.userEmail,
            }
          } catch (error) {
            console.warn(`Error fetching profile for member ${memberId}:`, error)
            // Retornar datos básicos si falla
            return {
              id: memberId,
              name: memberId.split('@')[0] || memberId,
              email: memberId.includes('@') ? memberId : `${memberId}@example.com`,
            }
          }
        })
      )

      setUsers(memberProfiles)
    } catch (error) {
      console.error("Error fetching project members:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del proyecto",
        variant: "destructive",
      })
      setUsers([])
    }
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAssignedToError("")

    try {
      if (!user?.id) {
        throw new Error('Debes estar autenticado para crear tareas')
      }

      if (!userStoryId || userStoryId.trim() === '') {
        throw new Error('El ID de la user story es requerido')
      }

      // Validar que se haya asignado a alguien
      if (!assignedTo || assignedTo.trim() === '') {
        setAssignedToError("Debes asignar la tarea a un usuario")
        setIsLoading(false)
        return
      }

      console.log('[CreateTaskDialog] Creating task with:', {
        userStoryId,
        createdBy: user.id,
        title,
        estimatedHours: Number.parseInt(estimatedHours),
        priority,
        status,
        assignedTo,
      })

      const createdTask = await taskService.createTask({
        userStoryId: String(userStoryId),
        assignedTo: assignedTo, // Ahora es obligatorio, no puede ser null
        createdBy: String(user.id),
        title,
        description,
        estimatedHours: Number.parseInt(estimatedHours),
        priority: priority,
        status: status,
        aiGenerated: false,
      })

      toast({
        title: "Task creada",
        description: "La task ha sido creada exitosamente",
      })

      onOpenChange(false)
      onTaskCreated()
    } catch (error) {
      console.error("Error creating task:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la task"
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
    setTitle("")
    setDescription("")
    setEstimatedHours("3")
    setPriority("MEDIA")
    setStatus("TODO")
    setAssignedTo("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Task</DialogTitle>
          <DialogDescription>Crea una nueva task para esta user story</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Implementar funcionalidad de autenticación"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Desarrollar el sistema de login y registro de usuarios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Select value={estimatedHours} onValueChange={setEstimatedHours} required>
                <SelectTrigger id="estimatedHours">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="3">3 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="5">5 horas</SelectItem>
                  <SelectItem value="8">8 horas</SelectItem>
                  <SelectItem value="13">13 horas</SelectItem>
                  <SelectItem value="21">21 horas</SelectItem>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(value: "TODO" | "IN_PROGRESS" | "DONE") => setStatus(value)} required>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Por Hacer</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="DONE">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Asignar a <span className="text-destructive">*</span></Label>
              <Select 
                value={assignedTo} 
                onValueChange={(value) => {
                  setAssignedTo(value)
                  setAssignedToError("")
                }}
                required
              >
                <SelectTrigger id="assignedTo" className={assignedToError ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedToError && (
                <p className="text-sm text-destructive">{assignedToError}</p>
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
                "Crear Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

