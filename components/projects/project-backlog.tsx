"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Target, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateUserStoryDialog } from "@/components/backlogs/create-user-story-dialog"

interface UserStory {
  id: string
  title: string
  description: string
  priority: string
  storyPoints: number
  acceptanceCriteria: string[]
  status: string
  projectId: string
  createdBy: string
  createdAt: string
}

interface ProjectBacklogProps {
  projectId: string
  projectName: string
}

export function ProjectBacklog({ projectId, projectName }: ProjectBacklogProps) {
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserStories()
  }, [projectId])

  const fetchUserStories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs?projectId=${projectId}`)
      const data = await response.json()
      
      // Filter only user stories (objects with title, not containers with items array)
      const stories = data.filter((item: any) => item.title && !item.items)
      setUserStories(stories)
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
        return "bg-red-500"
      case "media":
      case "medium":
        return "bg-yellow-500"
      case "baja":
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "todo":
        return <Badge variant="secondary">Por hacer</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">En progreso</Badge>
      case "done":
        return <Badge className="bg-green-500">Completado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva User Story
        </Button>
      </div>

      {/* User Stories List */}
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
        <div className="space-y-4">
          {userStories.map((story) => (
            <Card key={story.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${getPriorityColor(story.priority)}`} />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        <CardDescription className="mt-1">{story.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusBadge(story.status)}
                    <Badge variant="outline" className="font-mono">
                      {story.storyPoints} pts
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Criterios de Aceptación:</p>
                  <ul className="space-y-1">
                    {story.acceptanceCriteria?.map((criteria, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  )
}
