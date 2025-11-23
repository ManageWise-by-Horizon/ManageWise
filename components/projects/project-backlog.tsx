"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Target, TrendingUp, MoreVertical, Edit, Trash2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateUserStoryDialog } from "@/components/backlogs/create-user-story-dialog"
import { EditUserStoryDialog } from "@/components/backlogs/edit-user-story-dialog"
import { UserStoryDetailModal } from "@/components/backlogs/user-story-detail-modal"
import { userStoryService } from "@/lib/domain/user-stories/services/user-story.service"
import type { UserStory as UserStoryType } from "@/lib/domain/user-stories/types/user-story.types"

// Usar el tipo del dominio y extenderlo con campos adicionales del frontend
type UserStory = UserStoryType & {
  priority?: "high" | "medium" | "low" | "Alta" | "Media" | "Baja"
  projectId?: string
  createdAt?: string
  qualityMetrics?: {
    bleu: number
    rouge: number
  }
}

interface ProjectBacklogProps {
  projectId: string
  projectName: string
  externalUserStories?: UserStory[] // User Stories desde el padre (actualizadas en tiempo real)
  onTaskCreated?: () => void // Callback para actualizar tareas en el proyecto
  onStoryCreated?: () => void // Callback para notificar al padre cuando se crea una user story
}

export function ProjectBacklog({ projectId, projectName, externalUserStories, onTaskCreated, onStoryCreated }: ProjectBacklogProps) {
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const { toast } = useToast()

  // Si hay User Stories externas (del padre), usarlas en lugar de fetch
  useEffect(() => {
    if (externalUserStories) {
      setUserStories(externalUserStories)
      setIsLoading(false)
    } else {
      fetchUserStories()
    }
  }, [projectId, externalUserStories])

  const fetchUserStories = async () => {
    try {
      if (!projectId) {
        console.error("[ProjectBacklog] Error: projectId es requerido")
        setUserStories([])
        setIsLoading(false)
        return
      }

      console.log(`[ProjectBacklog] Fetching user stories for projectId: ${projectId}`)

      // Usar el servicio DDD - el backend espera projectId como String (UUID)
      const data = await userStoryService.getUserStoriesByProjectId(projectId)
      
      console.log(`[ProjectBacklog] Raw data from backend:`, JSON.stringify(data, null, 2))
      console.log(`[ProjectBacklog] Data type:`, Array.isArray(data) ? 'array' : typeof data)
      console.log(`[ProjectBacklog] Data length:`, Array.isArray(data) ? data.length : 'N/A')
      
      // Mapear los datos del backend al formato del frontend
      const mappedData: UserStory[] = (Array.isArray(data) ? data : []).map((item: UserStoryType) => {
        console.log(`[ProjectBacklog] Mapping item:`, item)
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          storyPoints: item.storyPoints || 0,
          acceptanceCriteria: Array.isArray(item.acceptanceCriteria) ? item.acceptanceCriteria : [],
          aiGenerated: item.aiGenerated || false,
          priority: item.priority || 'MEDIA', // El backend devuelve 'ALTA', 'MEDIA', 'BAJA'
          status: item.status || 'TODO', // El backend devuelve 'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'
          projectId: item.projectId,
          createdBy: item.createdBy,
        }
      })
      
      console.log(`[ProjectBacklog] Loaded ${mappedData.length} user stories for project ${projectId}`)
      console.log(`[ProjectBacklog] Mapped data:`, JSON.stringify(mappedData, null, 2))
      setUserStories(mappedData)
    } catch (error) {
      console.error("[ProjectBacklog] Error fetching user stories:", error)
      console.error("[ProjectBacklog] Error details:", error instanceof Error ? error.message : String(error))
      toast({
        title: "Error",
        description: "No se pudieron cargar las user stories",
        variant: "destructive",
      })
      setUserStories([])
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "ALTA":
        return "bg-red-500 text-white"
      case "MEDIA":
        return "bg-yellow-500 text-white"
      case "BAJA":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "TODO":
        return "border-gray-500 text-gray-700 bg-gray-50"
      case "IN_PROGRESS":
        return "border-blue-500 text-blue-700 bg-blue-50"
      case "DONE":
        return "border-green-500 text-green-700 bg-green-50"
      case "BLOCKED":
        return "border-red-500 text-red-700 bg-red-50"
      default:
        return "border-gray-500 text-gray-700 bg-gray-50"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "TODO":
        return "Por Hacer"
      case "IN_PROGRESS":
        return "En Progreso"
      case "DONE":
        return "Completado"
      case "BLOCKED":
        return "Bloqueado"
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "ALTA":
        return "Alta"
      case "MEDIA":
        return "Media"
      case "BAJA":
        return "Baja"
      default:
        return priority
    }
  }

  const handleDeleteUserStory = async (storyId: string) => {
    try {
      // Usar el servicio DDD - el backend espera id como String (UUID)
      await userStoryService.deleteUserStory(storyId)
      
      toast({
        title: "User Story eliminada",
        description: "La user story ha sido eliminada exitosamente",
      })
      fetchUserStories()
    } catch (error) {
      console.error("Error deleting user story:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la user story",
        variant: "destructive",
      })
    }
  }

  const totalStoryPoints = userStories.reduce((sum, story) => sum + story.storyPoints, 0)

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User Stories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStories.length}</div>
            <p className="text-xs text-muted-foreground">en el backlog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStoryPoints}</div>
            <p className="text-xs text-muted-foreground">puntos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStories.filter((us) => (us.status || 'TODO') === "DONE").length}
            </div>
            <p className="text-xs text-muted-foreground">de {userStories.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Backlog</h2>
          <p className="text-muted-foreground">User Stories priorizadas para {projectName}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva User Story
        </Button>
      </div>

      {/* User Stories Table */}
      {userStories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay User Stories</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza agregando user stories a tu backlog
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera User Story
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <div 
            className="max-h-[400px] overflow-y-scroll backlog-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.5)'
            }}
          >
            <table className="w-full min-h-[500px]">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">ID</th>
                  <th className="text-left p-3 font-medium text-sm">Título</th>
                  <th className="text-left p-3 font-medium text-sm">Prioridad</th>
                  <th className="text-left p-3 font-medium text-sm">Story Points</th>
                  <th className="text-left p-3 font-medium text-sm">Estado</th>
                  <th className="text-left p-3 font-medium text-sm">IA</th>
                  <th className="text-left p-3 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {userStories
                  .sort((a, b) => {
                    // Ordenar por prioridad (ALTA > MEDIA > BAJA)
                    const priorityOrder: Record<string, number> = { 
                      "ALTA": 0, 
                      "MEDIA": 1, 
                      "BAJA": 2
                    }
                    const aPriority = a.priority?.toUpperCase() || 'MEDIA'
                    const bPriority = b.priority?.toUpperCase() || 'MEDIA'
                    const priorityDiff = (priorityOrder[aPriority] ?? 3) - (priorityOrder[bPriority] ?? 3)
                    // Si tienen la misma prioridad, ordenar por story points (mayor primero)
                    return priorityDiff !== 0 ? priorityDiff : (b.storyPoints || 0) - (a.storyPoints || 0)
                  })
                  .map((story, index) => (
                    <tr 
                      key={story.id} 
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedUserStory(story)
                        setIsDetailModalOpen(true)
                      }}
                    >
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          US-{String(index + 1).padStart(2, '0')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="max-w-xs">
                          <h4 className="font-medium text-sm line-clamp-2">{story.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{story.description}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getPriorityColor(story.priority || 'MEDIA')}>
                          {getPriorityLabel(story.priority || 'MEDIA')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{story.storyPoints}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(story.status || 'TODO')}
                        >
                          {getStatusLabel(story.status || 'TODO')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {story.aiGenerated && (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            IA
                          </Badge>
                        )}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUserStory(story)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteUserStory(story.id)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Story Dialog */}
      <CreateUserStoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        backlogId={projectId}
        onStoryCreated={() => {
          fetchUserStories()
          // Notificar al padre para que actualice las user stories en otros componentes
          if (onStoryCreated) {
            onStoryCreated()
          }
        }}
      />

      {/* Edit User Story Dialog */}
      <EditUserStoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userStory={selectedUserStory}
        onStoryUpdated={() => {
          fetchUserStories()
          // Notificar al padre para que actualice las user stories en otros componentes
          if (onStoryCreated) {
            onStoryCreated()
          }
        }}
      />

      {/* User Story Detail Modal */}
      <UserStoryDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        userStory={selectedUserStory as any}
        projectId={projectId}
        onTaskCreated={onTaskCreated}
      />
    </div>
  )
}
