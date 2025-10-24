"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Target, TrendingUp, MoreVertical, Edit, Trash2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateUserStoryDialog } from "@/components/backlogs/create-user-story-dialog"
import { UserStoryDetailModal } from "@/components/backlogs/user-story-detail-modal"
import { PermissionGuard, PermissionWrapper } from "@/components/projects/permission-guard"
import { useAuth } from "@/lib/auth/auth-context"

interface UserStory {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  storyPoints: number
  acceptanceCriteria: string[]
  status: string
  projectId: string
  createdBy: string
  createdAt: string
  aiGenerated?: boolean
  qualityMetrics?: {
    bleu: number
    rouge: number
  }
}

interface ProjectBacklogProps {
  projectId: string
  projectName: string
  externalUserStories?: UserStory[] // User Stories desde el padre (actualizadas en tiempo real)
}

export function ProjectBacklog({ projectId, projectName, externalUserStories }: ProjectBacklogProps) {
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories?projectId=${projectId}`)
      const data = await response.json()
      setUserStories(data)
    } catch (error) {
      console.error("Error fetching user stories:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las user stories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "alta":
      case "high":
        return "bg-red-500 text-white"
      case "media":
      case "medium":
        return "bg-yellow-500 text-white"
      case "baja":
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "todo":
        return "border-gray-500 text-gray-700 bg-gray-50"
      case "in_progress":
        return "border-blue-500 text-blue-700 bg-blue-50"
      case "done":
        return "border-green-500 text-green-700 bg-green-50"
      default:
        return "border-gray-500 text-gray-700 bg-gray-50"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "todo":
        return "Por Hacer"
      case "in_progress":
        return "En Progreso"
      case "done":
        return "Completado"
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "alta":
      case "high":
        return "Alta"
      case "media":
      case "medium":
        return "Media"
      case "baja":
      case "low":
        return "Baja"
      default:
        return priority
    }
  }

  const handleDeleteUserStory = async (storyId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories/${storyId}`, {
        method: "DELETE",
      })
      toast({
        title: "User Story eliminada",
        description: "La user story ha sido eliminada exitosamente",
      })
      fetchUserStories()
    } catch (error) {
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
              {userStories.filter((us) => us.status === "done").length}
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
        <PermissionGuard
          projectId={projectId}
          userId={user?.id || ""}
          requiredPermission="write"
        >
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva User Story
          </Button>
        </PermissionGuard>
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
            <PermissionGuard
              projectId={projectId}
              userId={user?.id || ""}
              requiredPermission="write"
            >
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera User Story
              </Button>
            </PermissionGuard>
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
                    const priorityOrder: Record<string, number> = { 
                      "alta": 0, "high": 0, 
                      "media": 1, "medium": 1, 
                      "baja": 2, "low": 2 
                    }
                    return (priorityOrder[a.priority.toLowerCase()] || 3) - (priorityOrder[b.priority.toLowerCase()] || 3)
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
                        <Badge className={getPriorityColor(story.priority)}>
                          {getPriorityLabel(story.priority)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{story.storyPoints}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(story.status)}
                        >
                          {getStatusLabel(story.status)}
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
                            <PermissionWrapper
                              projectId={projectId}
                              userId={user?.id || ""}
                              requiredPermission="write"
                            >
                              {(canWrite) => (
                                canWrite && (
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                )
                              )}
                            </PermissionWrapper>
                            <PermissionWrapper
                              projectId={projectId}
                              userId={user?.id || ""}
                              requiredPermission="delete"
                            >
                              {(canDelete) => (
                                canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUserStory(story.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                )
                              )}
                            </PermissionWrapper>
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
      {userStories.length > 0 && (
        <CreateUserStoryDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          projectId={projectId}
          backlogId={projectId}
          onStoryCreated={fetchUserStories}
        />
      )}

      {/* User Story Detail Modal */}
      <UserStoryDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        userStory={selectedUserStory}
        projectId={projectId}
      />
    </div>
  )
}
