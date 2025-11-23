"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Calendar, MoreVertical, Edit, Trash2, Video, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { meetingService } from "@/lib/domain/meetings/services/meeting.service"
import type { Meeting } from "@/lib/domain/meetings/types/meeting.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ProjectMeetingsProps {
  projectId: string
  projectName: string
  onMeetingUpdated?: () => void
}

export function ProjectMeetings({ projectId, projectName, onMeetingUpdated }: ProjectMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [meetingToEdit, setMeetingToEdit] = useState<Meeting | null>(null)
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null)
  const [newMeetingTitle, setNewMeetingTitle] = useState("")
  const [newMeetingDescription, setNewMeetingDescription] = useState("")
  const [newMeetingStartDate, setNewMeetingStartDate] = useState("")
  const [newMeetingEndDate, setNewMeetingEndDate] = useState("")
  const [newMeetingStatus, setNewMeetingStatus] = useState("SCHEDULED")
  const [editMeetingTitle, setEditMeetingTitle] = useState("")
  const [editMeetingDescription, setEditMeetingDescription] = useState("")
  const [editMeetingStartDate, setEditMeetingStartDate] = useState("")
  const [editMeetingEndDate, setEditMeetingEndDate] = useState("")
  const [editMeetingStatus, setEditMeetingStatus] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchMeetings()
  }, [projectId])

  const fetchMeetings = async () => {
    try {
      const data = await meetingService.getMeetingsByProjectId(projectId)
      setMeetings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[ProjectMeetings] Error fetching meetings:", error)
      setMeetings([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMeetingTitle || !newMeetingDescription || !newMeetingStartDate || !newMeetingEndDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    const startDateTime = new Date(newMeetingStartDate)
    const endDateTime = new Date(newMeetingEndDate)
    
    if (endDateTime <= startDateTime) {
      toast({
        title: "Error",
        description: "La fecha y hora de fin debe ser posterior a la fecha y hora de inicio",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de inicio sea en el futuro
    if (startDateTime < new Date()) {
      toast({
        title: "Error",
        description: "La fecha y hora de inicio debe ser igual o posterior a la fecha y hora actual",
        variant: "destructive",
      })
      return
    }

    try {
      // Convertir datetime-local a formato ISO 8601 que el backend espera
      // datetime-local devuelve "YYYY-MM-DDTHH:mm", pero LocalDateTime necesita "YYYY-MM-DDTHH:mm:ss"
      const formatDateTimeForBackend = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return dateTimeLocal
        // datetime-local devuelve formato "YYYY-MM-DDTHH:mm"
        // Necesitamos "YYYY-MM-DDTHH:mm:ss" para LocalDateTime
        if (dateTimeLocal.length === 16) {
          // Formato "YYYY-MM-DDTHH:mm" - agregar ":00" para segundos
          return dateTimeLocal + ":00"
        }
        // Si ya tiene segundos, usar tal cual (pero limitar a 19 caracteres)
        return dateTimeLocal.substring(0, 19)
      }

      const formattedStartDate = formatDateTimeForBackend(newMeetingStartDate)
      const formattedEndDate = formatDateTimeForBackend(newMeetingEndDate)

      const payload = {
        projectId: projectId,
        title: newMeetingTitle.trim(),
        description: newMeetingDescription.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: newMeetingStatus,
      }

      console.log("[ProjectMeetings] Creating meeting with payload:", JSON.stringify(payload, null, 2))

      await meetingService.createMeeting(payload)

      toast({
        title: "Reunión creada",
        description: "La reunión ha sido creada exitosamente",
      })

      // Reset form
      setNewMeetingTitle("")
      setNewMeetingDescription("")
      setNewMeetingStartDate("")
      setNewMeetingEndDate("")
      setNewMeetingStatus("SCHEDULED")
      setIsCreateDialogOpen(false)

      // Refresh meetings
      fetchMeetings()
      if (onMeetingUpdated) {
        onMeetingUpdated()
      }
    } catch (error) {
      console.error("[ProjectMeetings] Error creating meeting:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la reunión"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setMeetingToEdit(meeting)
    setEditMeetingTitle(meeting.title)
    setEditMeetingDescription(meeting.description)
    // Convertir fechas ISO a formato datetime-local
    setEditMeetingStartDate(meeting.startDate ? new Date(meeting.startDate).toISOString().slice(0, 16) : "")
    setEditMeetingEndDate(meeting.endDate ? new Date(meeting.endDate).toISOString().slice(0, 16) : "")
    setEditMeetingStatus(meeting.status)
    setIsEditDialogOpen(true)
  }

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!meetingToEdit || !editMeetingTitle || !editMeetingDescription || !editMeetingStartDate || !editMeetingEndDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    const startDateTime = new Date(editMeetingStartDate)
    const endDateTime = new Date(editMeetingEndDate)
    
    if (endDateTime <= startDateTime) {
      toast({
        title: "Error",
        description: "La fecha y hora de fin debe ser posterior a la fecha y hora de inicio",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de inicio sea en el futuro
    if (startDateTime < new Date()) {
      toast({
        title: "Error",
        description: "La fecha y hora de inicio debe ser igual o posterior a la fecha y hora actual",
        variant: "destructive",
      })
      return
    }

    try {
      // Convertir datetime-local a formato ISO 8601 que el backend espera
      const formatDateTimeForBackend = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return dateTimeLocal
        // datetime-local devuelve formato "YYYY-MM-DDTHH:mm"
        // Necesitamos "YYYY-MM-DDTHH:mm:ss" para LocalDateTime
        if (dateTimeLocal.length === 16) {
          // Formato "YYYY-MM-DDTHH:mm" - agregar ":00" para segundos
          return dateTimeLocal + ":00"
        }
        // Si ya tiene segundos, usar tal cual (pero limitar a 19 caracteres)
        return dateTimeLocal.substring(0, 19)
      }

      const formattedStartDate = formatDateTimeForBackend(editMeetingStartDate)
      const formattedEndDate = formatDateTimeForBackend(editMeetingEndDate)

      const payload = {
        id: meetingToEdit.id,
        title: editMeetingTitle.trim(),
        description: editMeetingDescription.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: editMeetingStatus || meetingToEdit.status,
      }

      console.log("[ProjectMeetings] Updating meeting with payload:", JSON.stringify(payload, null, 2))

      await meetingService.updateMeeting(meetingToEdit.id, payload)

      toast({
        title: "Reunión actualizada",
        description: "La reunión ha sido actualizada exitosamente",
      })

      // Reset form
      setMeetingToEdit(null)
      setEditMeetingTitle("")
      setEditMeetingDescription("")
      setEditMeetingStartDate("")
      setEditMeetingEndDate("")
      setEditMeetingStatus("")
      setIsEditDialogOpen(false)

      // Refresh meetings
      fetchMeetings()
      if (onMeetingUpdated) {
        onMeetingUpdated()
      }
    } catch (error) {
      console.error("[ProjectMeetings] Error updating meeting:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar la reunión"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeeting = (meeting: Meeting) => {
    setMeetingToDelete(meeting)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return

    try {
      await meetingService.deleteMeeting(meetingToDelete.id)

      toast({
        title: "Reunión eliminada",
        description: "La reunión ha sido eliminada exitosamente",
      })

      setMeetingToDelete(null)
      setIsDeleteDialogOpen(false)

      // Refresh meetings
      fetchMeetings()
      if (onMeetingUpdated) {
        onMeetingUpdated()
      }
    } catch (error) {
      console.error("[ProjectMeetings] Error deleting meeting:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar la reunión"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      SCHEDULED: { label: "Programada", color: "bg-blue-500 text-white" },
      IN_PROGRESS: { label: "En Progreso", color: "bg-yellow-500 text-white" },
      COMPLETED: { label: "Completada", color: "bg-green-500 text-white" },
      CANCELLED: { label: "Cancelada", color: "bg-red-500 text-white" },
    }
    return statusMap[status.toUpperCase()] || { label: status, color: "bg-muted" }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openMeetingUrl = (url: string) => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reuniones</h2>
          <p className="text-muted-foreground">Gestiona las reuniones del proyecto</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Reunión
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay reuniones</p>
            <p className="text-sm text-muted-foreground mb-4">Crea tu primera reunión para comenzar</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Reunión
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => {
            const statusBadge = getStatusBadge(meeting.status)
            return (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <CardDescription className="mt-1">{meeting.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMeeting(meeting)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMeeting(meeting)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDateTime(meeting.startDate)} - {formatDateTime(meeting.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      {meeting.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMeetingUrl(meeting.url)}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Unirse
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nueva Reunión</DialogTitle>
            <DialogDescription>Crea una nueva reunión para el proyecto</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMeeting}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Ej: Daily Standup"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={newMeetingDescription}
                  onChange={(e) => setNewMeetingDescription(e.target.value)}
                  placeholder="Descripción de la reunión"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha y Hora de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newMeetingStartDate}
                    onChange={(e) => setNewMeetingStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha y Hora de Fin *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newMeetingEndDate}
                    onChange={(e) => setNewMeetingEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={newMeetingStatus} onValueChange={setNewMeetingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Programada</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completada</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Reunión</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Reunión</DialogTitle>
            <DialogDescription>Modifica los detalles de la reunión</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMeeting}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editMeetingTitle}
                  onChange={(e) => setEditMeetingTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción *</Label>
                <Textarea
                  id="edit-description"
                  value={editMeetingDescription}
                  onChange={(e) => setEditMeetingDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Fecha y Hora de Inicio *</Label>
                  <Input
                    id="edit-startDate"
                    type="datetime-local"
                    value={editMeetingStartDate}
                    onChange={(e) => setEditMeetingStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Fecha y Hora de Fin *</Label>
                  <Input
                    id="edit-endDate"
                    type="datetime-local"
                    value={editMeetingEndDate}
                    onChange={(e) => setEditMeetingEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select value={editMeetingStatus} onValueChange={setEditMeetingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Programada</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completada</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Meeting Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Reunión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la reunión "{meetingToDelete?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteMeeting}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

