"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Calendar, ListTodo, MoreVertical, Edit, Trash2, Target, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createApiUrl } from "@/lib/api-config"
import { userStoryService } from "@/lib/domain/user-stories/services/user-story.service"
import { getApiClient } from "@/lib/infrastructure/api/api-client"
import type { UserStory } from "@/lib/domain/user-stories/types/user-story.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Sprint {
  id: string
  projectId: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
}

interface ProjectSprintsProps {
  projectId: string
  projectName: string
  externalUserStories?: UserStory[]
  onSprintUpdated?: () => void
}

export function ProjectSprints({ projectId, projectName, externalUserStories, onSprintUpdated }: ProjectSprintsProps) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [sprintToEdit, setSprintToEdit] = useState<Sprint | null>(null)
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null)
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const [newSprintTitle, setNewSprintTitle] = useState("")
  const [newSprintDescription, setNewSprintDescription] = useState("")
  const [newSprintStartDate, setNewSprintStartDate] = useState("")
  const [newSprintEndDate, setNewSprintEndDate] = useState("")
  const [editSprintTitle, setEditSprintTitle] = useState("")
  const [editSprintDescription, setEditSprintDescription] = useState("")
  const [editSprintStartDate, setEditSprintStartDate] = useState("")
  const [editSprintEndDate, setEditSprintEndDate] = useState("")
  const [editSprintStatus, setEditSprintStatus] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchSprints()
  }, [projectId])

  useEffect(() => {
    fetchUserStories()
  }, [projectId, externalUserStories])

  const fetchSprints = async () => {
    try {
      const apiClient = getApiClient()
      const data = await apiClient.get<Sprint[]>(`/api/v1/sprints/project/${projectId}`)
      setSprints(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[ProjectSprints] Error fetching sprints:", error)
      setSprints([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserStories = async () => {
    try {
      if (externalUserStories) {
        setUserStories(externalUserStories)
      } else {
        const data = await userStoryService.getUserStoriesByProjectId(projectId)
        setUserStories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("[ProjectSprints] Error fetching user stories:", error)
      setUserStories([])
    }
  }

  const handleAssignStories = async () => {
    if (!selectedSprint || selectedStories.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un sprint y al menos una user story",
        variant: "destructive",
      })
      return
    }

    try {
      // Asignar las user stories seleccionadas al sprint
      await Promise.all(
        selectedStories.map(async (storyId) => {
          // Obtener la user story actual para preservar todos los campos
          const currentStory = await userStoryService.getUserStoryById(storyId)
          
          // Actualizar solo el sprintId, manteniendo todos los demás campos
          await userStoryService.updateUserStory(storyId, {
            id: storyId,
            projectId: currentStory.projectId,
            title: currentStory.title,
            description: currentStory.description,
            storyPoints: currentStory.storyPoints,
            priority: currentStory.priority,
            status: currentStory.status,
            acceptanceCriteria: currentStory.acceptanceCriteria || [],
            sprintId: selectedSprint.id,
          })
        })
      )

      toast({
        title: "User Stories asignadas",
        description: `${selectedStories.length} user stories asignadas al sprint ${selectedSprint.title}`,
      })

      setIsAssignDialogOpen(false)
      setSelectedSprint(null)
      setSelectedStories([])
      fetchUserStories()
      if (onSprintUpdated) {
        onSprintUpdated()
      }
    } catch (error) {
      console.error("[ProjectSprints] Error assigning stories:", error)
      toast({
        title: "Error",
        description: "No se pudieron asignar las user stories",
        variant: "destructive",
      })
    }
  }

  const handleUnassignStory = async (storyId: string) => {
    try {
      // Obtener la user story actual para preservar todos los campos
      const currentStory = await userStoryService.getUserStoryById(storyId)
      
      // Actualizar solo el sprintId a null, manteniendo todos los demás campos
      await userStoryService.updateUserStory(storyId, {
        id: storyId,
        projectId: currentStory.projectId,
        title: currentStory.title,
        description: currentStory.description,
        storyPoints: currentStory.storyPoints,
        priority: currentStory.priority,
        status: currentStory.status,
        acceptanceCriteria: currentStory.acceptanceCriteria || [],
        sprintId: null,
      })

      toast({
        title: "User Story desasignada",
        description: "La user story ha sido removida del sprint",
      })

      fetchUserStories()
      if (onSprintUpdated) {
        onSprintUpdated()
      }
    } catch (error) {
      console.error("[ProjectSprints] Error unassigning story:", error)
      toast({
        title: "Error",
        description: "No se pudo desasignar la user story",
        variant: "destructive",
      })
    }
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSprintTitle || !newSprintDescription || !newSprintStartDate || !newSprintEndDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (new Date(newSprintEndDate) <= new Date(newSprintStartDate)) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      })
      return
    }

    try {
      // Asegurar que las fechas estén en formato ISO (YYYY-MM-DD)
      const startDate = newSprintStartDate.split('T')[0] // Remover hora si existe
      const endDate = newSprintEndDate.split('T')[0] // Remover hora si existe

      const payload = {
        projectId: projectId,
        title: newSprintTitle.trim(),
        description: newSprintDescription.trim(),
        startDate: startDate,
        endDate: endDate,
      }

      console.log("[ProjectSprints] Creating sprint with payload:", payload)

      const apiClient = getApiClient()
      const createdSprint = await apiClient.post<Sprint>("/api/v1/sprints", payload)
      console.log("[ProjectSprints] Sprint created successfully:", createdSprint)

      toast({
        title: "Sprint creado",
        description: "El sprint ha sido creado exitosamente",
      })

      // Reset form
      setNewSprintTitle("")
      setNewSprintDescription("")
      setNewSprintStartDate("")
      setNewSprintEndDate("")
      setIsCreateDialogOpen(false)

      // Refresh sprints
      fetchSprints()
      if (onSprintUpdated) {
        onSprintUpdated()
      }
    } catch (error) {
      console.error("[ProjectSprints] Error creating sprint:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el sprint"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditSprint = (sprint: Sprint) => {
    setSprintToEdit(sprint)
    setEditSprintTitle(sprint.title)
    setEditSprintDescription(sprint.description)
    setEditSprintStartDate(sprint.startDate.split('T')[0]) // Formato YYYY-MM-DD
    setEditSprintEndDate(sprint.endDate.split('T')[0])
    setEditSprintStatus(sprint.status)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sprintToEdit || !editSprintTitle || !editSprintDescription || !editSprintStartDate || !editSprintEndDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (new Date(editSprintEndDate) <= new Date(editSprintStartDate)) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      })
      return
    }

    try {
      const startDate = editSprintStartDate.split('T')[0]
      const endDate = editSprintEndDate.split('T')[0]

      const payload = {
        id: sprintToEdit.id,
        title: editSprintTitle.trim(),
        description: editSprintDescription.trim(),
        startDate: startDate,
        endDate: endDate,
        status: editSprintStatus || sprintToEdit.status,
      }

      console.log("[ProjectSprints] Updating sprint with payload:", payload)

      const apiClient = getApiClient()
      await apiClient.put<Sprint>(`/api/v1/sprints/${sprintToEdit.id}`, payload)

      toast({
        title: "Sprint actualizado",
        description: "El sprint ha sido actualizado exitosamente",
      })

      // Reset form
      setSprintToEdit(null)
      setEditSprintTitle("")
      setEditSprintDescription("")
      setEditSprintStartDate("")
      setEditSprintEndDate("")
      setEditSprintStatus("")
      setIsEditDialogOpen(false)

      // Refresh sprints
      fetchSprints()
      if (onSprintUpdated) {
        onSprintUpdated()
      }
    } catch (error) {
      console.error("[ProjectSprints] Error updating sprint:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el sprint"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSprint = (sprint: Sprint) => {
    setSprintToDelete(sprint)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteSprint = async () => {
    if (!sprintToDelete) return

    try {
      const apiClient = getApiClient()
      await apiClient.delete(`/api/v1/sprints/${sprintToDelete.id}`)

      toast({
        title: "Sprint eliminado",
        description: "El sprint ha sido eliminado exitosamente",
      })

      // Desasignar user stories del sprint eliminado
      const sprintStories = getSprintStories(sprintToDelete.id)
      if (sprintStories.length > 0) {
        await Promise.all(
          sprintStories.map(async (story) => {
            const currentStory = await userStoryService.getUserStoryById(story.id)
            await userStoryService.updateUserStory(story.id, {
              id: story.id,
              projectId: currentStory.projectId,
              title: currentStory.title,
              description: currentStory.description,
              storyPoints: currentStory.storyPoints,
              priority: currentStory.priority,
              status: currentStory.status,
              acceptanceCriteria: currentStory.acceptanceCriteria || [],
              sprintId: null,
            })
          })
        )
      }

      setSprintToDelete(null)
      setIsDeleteDialogOpen(false)

      // Refresh sprints
      fetchSprints()
      fetchUserStories()
      if (onSprintUpdated) {
        onSprintUpdated()
      }
    } catch (error) {
      console.error("[ProjectSprints] Error deleting sprint:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el sprint"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PLANNED: { label: "Planificado", color: "bg-blue-500 text-white" },
      ACTIVE: { label: "Activo", color: "bg-green-500 text-white" },
      COMPLETED: { label: "Completado", color: "bg-gray-500 text-white" },
      CANCELLED: { label: "Cancelado", color: "bg-red-500 text-white" },
    }
    return statusMap[status.toUpperCase()] || { label: status, color: "bg-muted" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getSprintStories = (sprintId: string) => {
    return userStories.filter((story) => story.sprintId === sprintId)
  }

  const getUnassignedStories = () => {
    return userStories.filter((story) => !story.sprintId || story.sprintId === null)
  }

  const totalStoryPoints = (stories: UserStory[]) => {
    return stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sprints</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprints.length}</div>
            <p className="text-xs text-muted-foreground">sprints activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Stories Asignadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStories.filter((us) => us.sprintId && us.sprintId !== null).length}
            </div>
            <p className="text-xs text-muted-foreground">de {userStories.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUnassignedStories().length}</div>
            <p className="text-xs text-muted-foreground">user stories disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Points Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStoryPoints(userStories)}</div>
            <p className="text-xs text-muted-foreground">puntos en el proyecto</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Gestiona los sprints y asigna user stories para {projectName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Sprint
          </Button>
          <Button onClick={() => setIsAssignDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Asignar User Stories
          </Button>
        </div>
      </div>

      {/* Sprints Grid */}
      {sprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay Sprints</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer sprint para comenzar a organizar el trabajo
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const sprintStories = getSprintStories(sprint.id)
            const statusBadge = getStatusBadge(sprint.status)

            return (
              <Card key={sprint.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-chart-1" />
                        <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{sprint.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{sprint.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSprint(sprint)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSprint(sprint)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{sprintStories.length} user stories</span>
                      </div>
                      <div className="text-muted-foreground">
                        {totalStoryPoints(sprintStories)} pts
                      </div>
                    </div>

                    {sprintStories.length > 0 && (
                      <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                        {sprintStories.map((story) => (
                          <div
                            key={story.id}
                            className="flex items-center justify-between rounded p-1 hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{story.title}</p>
                              <p className="text-xs text-muted-foreground">{story.storyPoints} pts</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnassignStory(story.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Unassigned Stories */}
      {getUnassignedStories().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Stories Sin Asignar</CardTitle>
            <CardDescription>User stories disponibles para asignar a sprints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUnassignedStories().map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{story.title}</p>
                    <p className="text-xs text-muted-foreground">{story.storyPoints} pts • {story.priority}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSprint(null)
                      setSelectedStories([story.id])
                      setIsAssignDialogOpen(true)
                    }}
                  >
                    Asignar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Stories Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar User Stories a Sprint</DialogTitle>
            <DialogDescription>
              Selecciona un sprint y las user stories que deseas asignar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sprint</label>
              <Select
                value={selectedSprint?.id || ""}
                onValueChange={(value) => {
                  const sprint = sprints.find((s) => s.id === value)
                  setSelectedSprint(sprint || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.title} - {formatDate(sprint.startDate)} a {formatDate(sprint.endDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSprint && (
              <div className="space-y-2">
                <label className="text-sm font-medium">User Stories Disponibles</label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {getUnassignedStories().map((story) => (
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
                        <p className="text-xs text-muted-foreground">{story.storyPoints} pts • {story.priority}</p>
                      </div>
                    </div>
                  ))}
                  {getUnassignedStories().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay user stories disponibles para asignar
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAssignStories}
              disabled={!selectedSprint || selectedStories.length === 0}
            >
              Asignar {selectedStories.length > 0 ? `${selectedStories.length} ` : ""}User Stories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sprint Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sprint</DialogTitle>
            <DialogDescription>
              Crea un nuevo sprint para organizar el trabajo del proyecto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSprint} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprintTitle">Título del Sprint</Label>
              <Input
                id="sprintTitle"
                placeholder="Sprint 1 - Autenticación y Dashboard"
                value={newSprintTitle}
                onChange={(e) => setNewSprintTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprintDescription">Descripción</Label>
              <Textarea
                id="sprintDescription"
                placeholder="Implementar sistema de autenticación y crear el dashboard principal del proyecto"
                value={newSprintDescription}
                onChange={(e) => setNewSprintDescription(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sprintStartDate">Fecha de Inicio</Label>
                <Input
                  id="sprintStartDate"
                  type="date"
                  value={newSprintStartDate}
                  onChange={(e) => setNewSprintStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprintEndDate">Fecha de Fin</Label>
                <Input
                  id="sprintEndDate"
                  type="date"
                  value={newSprintEndDate}
                  onChange={(e) => setNewSprintEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Crear Sprint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Sprint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Sprint</DialogTitle>
            <DialogDescription>
              Actualiza la información del sprint
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSprint} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSprintTitle">Título del Sprint</Label>
              <Input
                id="editSprintTitle"
                placeholder="Sprint 1 - Autenticación y Dashboard"
                value={editSprintTitle}
                onChange={(e) => setEditSprintTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSprintDescription">Descripción</Label>
              <Textarea
                id="editSprintDescription"
                placeholder="Implementar sistema de autenticación y crear el dashboard principal del proyecto"
                value={editSprintDescription}
                onChange={(e) => setEditSprintDescription(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editSprintStartDate">Fecha de Inicio</Label>
                <Input
                  id="editSprintStartDate"
                  type="date"
                  value={editSprintStartDate}
                  onChange={(e) => setEditSprintStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSprintEndDate">Fecha de Fin</Label>
                <Input
                  id="editSprintEndDate"
                  type="date"
                  value={editSprintEndDate}
                  onChange={(e) => setEditSprintEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSprintStatus">Estado</Label>
              <Select value={editSprintStatus} onValueChange={setEditSprintStatus}>
                <SelectTrigger id="editSprintStatus">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planificado</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Edit className="mr-2 h-4 w-4" />
                Actualizar Sprint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Sprint Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Sprint?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El sprint será eliminado y las user stories asignadas serán desasignadas.
              {sprintToDelete && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="font-medium">{sprintToDelete.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSprintStories(sprintToDelete.id).length} user stories asignadas
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteSprint}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

