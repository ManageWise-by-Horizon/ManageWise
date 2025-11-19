"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Clock, 
  Edit3, 
  Save, 
  X, 
  Calendar,
  Flag,
  Sparkles,
  Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { taskService } from "@/lib/domain/tasks/services/task.service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TaskDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    title: string
    description: string
    status: string
    assignedTo?: string
    priority: string
    estimatedHours: number
    projectId?: string
    userStoryId?: string
    aiAssigned?: boolean
    dueDate?: string
    createdAt?: string
  } | null
  members: Array<{
    id: string
    name: string
    email?: string
    role?: string
    avatar?: string
  }>
  onUpdate: () => void
}


export function TaskDetailModal({ open, onOpenChange, task, members, onUpdate }: TaskDetailModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [localTask, setLocalTask] = useState(task)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (task && open) {
      setLocalTask(task)
      setEditedTitle(task.title)
      setEditedDescription(task.description || "")
    }
  }, [task, open])

  useEffect(() => {
    setLocalTask(task)
  }, [task])


  const handleSaveChanges = async () => {
    if (!localTask) return
    
    try {
      // Obtener la tarea completa del backend para asegurar que tenemos todos los campos requeridos
      const fullTask = await taskService.getTaskById(localTask.id)
      
      // Mapear prioridad y estado al formato del backend
      const mapPriorityToBackend = (priority: string): "ALTA" | "MEDIA" | "BAJA" => {
        if (priority === "high") return "ALTA"
        if (priority === "medium") return "MEDIA"
        if (priority === "low") return "BAJA"
        return "MEDIA" // default
      }

      const mapStatusToBackend = (status: string): "TODO" | "IN_PROGRESS" | "DONE" => {
        if (status === "todo") return "TODO"
        if (status === "in_progress") return "IN_PROGRESS"
        if (status === "done") return "DONE"
        return "TODO" // default
      }

      // Actualizar usando el servicio DDD
      await taskService.updateTask(localTask.id, {
        id: localTask.id,
        title: editedTitle,
        description: editedDescription,
        estimatedHours: fullTask.estimatedHours,
        status: mapStatusToBackend(localTask.status),
        priority: mapPriorityToBackend(localTask.priority),
        assignedTo: fullTask.assignedTo || null,
      })

      // Update local state immediately
      setLocalTask(prev => prev ? { ...prev, title: editedTitle, description: editedDescription } : prev)
      
      toast({
        title: "Tarea actualizada",
        description: "Los cambios se han guardado correctamente",
      })
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    }
  }

  const handleAssignUser = async (userId: string) => {
    if (!localTask) return
    
    // Convert "unassigned" back to null/empty for the API
    const assignedToValue = userId === "unassigned" ? null : userId
    
    try {
      // Obtener la tarea completa del backend para asegurar que tenemos todos los campos requeridos
      const fullTask = await taskService.getTaskById(localTask.id)
      
      // Mapear prioridad y estado al formato del backend
      const mapPriorityToBackend = (priority: string): "ALTA" | "MEDIA" | "BAJA" => {
        if (priority === "high") return "ALTA"
        if (priority === "medium") return "MEDIA"
        if (priority === "low") return "BAJA"
        return "MEDIA" // default
      }

      const mapStatusToBackend = (status: string): "TODO" | "IN_PROGRESS" | "DONE" => {
        if (status === "todo") return "TODO"
        if (status === "in_progress") return "IN_PROGRESS"
        if (status === "done") return "DONE"
        return "TODO" // default
      }

      // Actualizar usando el servicio DDD
      await taskService.updateTask(localTask.id, {
        id: localTask.id,
        title: fullTask.title,
        description: fullTask.description,
        estimatedHours: fullTask.estimatedHours,
        status: mapStatusToBackend(localTask.status),
        priority: mapPriorityToBackend(localTask.priority),
        assignedTo: assignedToValue,
      })

      // Update local task state immediately for real-time update
      setLocalTask(prev => prev ? { ...prev, assignedTo: assignedToValue || undefined } : prev)
      
      toast({
        title: "Asignación actualizada",
        description: "La tarea se ha asignado correctamente",
      })
      onUpdate()
    } catch (error) {
      console.error("Error assigning task:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar la tarea",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePriority = async (priority: string) => {
    if (!localTask) return
    
    try {
      // Obtener la tarea completa del backend para asegurar que tenemos todos los campos requeridos
      const fullTask = await taskService.getTaskById(localTask.id)
      
      // Mapear prioridad y estado al formato del backend
      const mapPriorityToBackend = (priority: string): "ALTA" | "MEDIA" | "BAJA" => {
        if (priority === "high") return "ALTA"
        if (priority === "medium") return "MEDIA"
        if (priority === "low") return "BAJA"
        return "MEDIA" // default
      }

      const mapStatusToBackend = (status: string): "TODO" | "IN_PROGRESS" | "DONE" => {
        if (status === "todo") return "TODO"
        if (status === "in_progress") return "IN_PROGRESS"
        if (status === "done") return "DONE"
        return "TODO" // default
      }

      // Mapear la prioridad del frontend al backend
      const backendPriority = mapPriorityToBackend(priority)

      // Actualizar usando el servicio DDD
      await taskService.updateTask(localTask.id, {
        id: localTask.id,
        title: fullTask.title,
        description: fullTask.description,
        estimatedHours: fullTask.estimatedHours,
        status: mapStatusToBackend(localTask.status),
        priority: backendPriority,
        assignedTo: fullTask.assignedTo || null,
      })

      // Update local state immediately
      setLocalTask(prev => prev ? { ...prev, priority } : prev)
      
      toast({
        title: "Prioridad actualizada",
        description: "La prioridad de la tarea se ha actualizado",
      })
      onUpdate()
    } catch (error) {
      console.error("Error updating priority:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la prioridad",
        variant: "destructive",
      })
    }
  }


  const handleDelete = async () => {
    if (!localTask) return

    setIsDeleting(true)
    try {
      await taskService.deleteTask(localTask.id)
      
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
      })

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
            day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500", 
      low: "bg-green-500",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      todo: { label: "Por Hacer", color: "bg-gray-500" },
      in_progress: { label: "En Progreso", color: "bg-blue-500" },
      done: { label: "Completado", color: "bg-green-500" },
    }
    return statusMap[status] || { label: status, color: "bg-muted" }
  }

  const assignedUser = localTask?.assignedTo ? members.find(m => m.id === localTask.assignedTo) : null

  if (!localTask) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden sm:max-w-7xl md:max-w-7xl lg:max-w-7xl xl:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Detalles de la tarea</DialogTitle>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveChanges}>
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{localTask.title}</h2>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {localTask.aiAssigned && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      IA
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-[600px]">
          {/* Main Content */}
          <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Añadir una descripción más detallada..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {localTask.description || "Sin descripción"}
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto pr-2 max-h-[600px]">
            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={cn("text-white", getStatusBadge(localTask.status).color)}>
                  {getStatusBadge(localTask.status).label}
                </Badge>
              </CardContent>
            </Card>

            {/* Assigned To */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Asignado a
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={localTask.assignedTo || "unassigned"} onValueChange={handleAssignUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar">
                      {assignedUser && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={assignedUser.avatar} />
                            <AvatarFallback className="text-xs">{assignedUser.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignedUser.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Prioridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={localTask.priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getPriorityColor(localTask.priority))} />
                        <span className="text-sm">
                          {localTask.priority === "high" ? "Alta" : localTask.priority === "medium" ? "Media" : "Baja"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        Media
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Baja
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Estimated Hours */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tiempo estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{localTask.estimatedHours}h</p>
              </CardContent>
            </Card>

            {/* Due Date */}
            {localTask.dueDate && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha límite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(localTask.dueDate)}</p>
                </CardContent>
              </Card>
            )}

            {/* Created */}
            {localTask.createdAt && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Creado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{formatDate(localTask.createdAt)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea "{localTask?.title}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}