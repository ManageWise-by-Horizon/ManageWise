"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Plus, Sparkles, TrendingUp, Target, MoreVertical, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { UserStoryCard } from "@/components/backlogs/user-story-card"
import { CreateUserStoryDialog } from "@/components/backlogs/create-user-story-dialog"
import { UserStoryDetailModal } from "@/components/backlogs/user-story-detail-modal"

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: "high" | "medium" | "low" | "Alta" | "Media" | "Baja"
  storyPoints: number
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

interface Backlog {
  id: string
  projectId: string
  type: "product" | "sprint"
  items: string[]
  createdAt: string
  status: string
}

export default function BacklogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const { toast } = useToast()
  const [backlog, setBacklog] = useState<Backlog | null>(null)
  const [project, setProject] = useState<any>(null)
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchBacklogDetails()
  }, [resolvedParams.id])

  const fetchBacklogDetails = async () => {
    try {
      console.log("[DEBUG] Fetching backlog with ID:", resolvedParams.id)
      console.log("[DEBUG] API URL:", process.env.NEXT_PUBLIC_API_URL)
      
      const backlogRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${resolvedParams.id}`)
      const backlogData = await backlogRes.json()
      console.log("[DEBUG] Backlog data:", backlogData)
      setBacklog(backlogData)

      // Fetch project
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${backlogData.projectId}`)
      const projectData = await projectRes.json()
      console.log("[DEBUG] Project data:", projectData)
      setProject(projectData)

      // Fetch user stories from userStories collection
      const storiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`)
      const storiesData = await storiesRes.json()
      console.log("[DEBUG] All user stories:", storiesData.length)
      console.log("[DEBUG] Backlog items:", backlogData.items)
      
      // Filter stories that are in the backlog items
      const backlogStories = storiesData.filter((s: any) => {
        const isIncluded = backlogData.items.includes(s.id)
        console.log(`[DEBUG] Story ${s.id} (${s.title}) - Included: ${isIncluded}`)
        return isIncluded
      })
      console.log("[DEBUG] Filtered backlog stories:", backlogStories.length)
      console.log("[DEBUG] Backlog stories:", backlogStories)
      console.log("[DEBUG] First few stories for debugging:", backlogStories.slice(0, 3))
      setUserStories(backlogStories)
    } catch (error) {
      console.error("[v0] Error fetching backlog details:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el backlog",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityStats = () => {
    const high = userStories.filter((s) => s.priority === "high" || s.priority === "Alta").length
    const medium = userStories.filter((s) => s.priority === "medium" || s.priority === "Media").length
    const low = userStories.filter((s) => s.priority === "low" || s.priority === "Baja").length
    return { high, medium, low }
  }

  const getAverageQuality = () => {
    const aiStories = userStories.filter((s) => s.aiGenerated && s.qualityMetrics)
    if (aiStories.length === 0) return null

    const avgBleu = aiStories.reduce((sum, s) => sum + (s.qualityMetrics?.bleu || 0), 0) / aiStories.length
    const avgRouge = aiStories.reduce((sum, s) => sum + (s.qualityMetrics?.rouge || 0), 0) / aiStories.length

    return { bleu: avgBleu, rouge: avgRouge }
  }

  const totalStoryPoints = userStories.reduce((sum, s) => sum + s.storyPoints, 0)
  const priorityStats = getPriorityStats()
  const qualityMetrics = getAverageQuality()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!backlog || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold">Backlog no encontrado</h2>
        <Link href="/backlogs">
          <Button className="mt-4">Volver a Backlogs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/backlogs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <Badge variant={backlog.type === "product" ? "default" : "secondary"}>
                {backlog.type === "product" ? "Product Backlog" : "Sprint Backlog"}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
          <Plus className="mr-2 h-4 w-4" />
          Nueva User Story
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User Stories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStories.length}</div>
            <p className="text-xs text-muted-foreground">{totalStoryPoints} story points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridad Alta</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priorityStats.high}</div>
            <p className="text-xs text-muted-foreground">
              {priorityStats.medium} media, {priorityStats.low} baja
            </p>
          </CardContent>
        </Card>

        {qualityMetrics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BLEU Score</CardTitle>
                <Sparkles className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(qualityMetrics.bleu * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Calidad de generación IA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROUGE Score</CardTitle>
                <Sparkles className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(qualityMetrics.rouge * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Precisión de contenido</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* User Stories Table */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">User Stories</h2>
        {userStories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No hay user stories</h3>
              <p className="mb-4 text-sm text-muted-foreground">Crea tu primera user story para comenzar</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Crear User Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b">
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
                        "high": 0, "Alta": 0, 
                        "medium": 1, "Media": 1, 
                        "low": 2, "Baja": 2 
                      }
                      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
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
                          <Badge 
                            className={
                              (story.priority === "high" || story.priority === "Alta")
                                ? "bg-red-500 text-white" 
                                : (story.priority === "medium" || story.priority === "Media")
                                ? "bg-yellow-500 text-white"
                                : "bg-green-500 text-white"
                            }
                          >
                            {story.priority === "high" || story.priority === "Alta" ? "Alta" : 
                             story.priority === "medium" || story.priority === "Media" ? "Media" : "Baja"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{story.storyPoints}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant="outline" 
                            className={
                              story.status === "done"
                                ? "border-green-500 text-green-700 bg-green-50"
                                : story.status === "in_progress"
                                ? "border-blue-500 text-blue-700 bg-blue-50"
                                : "border-gray-500 text-gray-700 bg-gray-50"
                            }
                          >
                            {story.status === "done" ? "Completado" : story.status === "in_progress" ? "En Progreso" : "Por Hacer"}
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
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  try {
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories/${story.id}`, {
                                      method: "DELETE",
                                    })
                                    toast({
                                      title: "User Story eliminada",
                                      description: "La user story ha sido eliminada exitosamente",
                                    })
                                    fetchBacklogDetails()
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "No se pudo eliminar la user story",
                                      variant: "destructive",
                                    })
                                  }
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
      </div>

      {/* Create User Story Dialog */}
      <CreateUserStoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        backlogId={backlog.id}
        projectId={project.id}
        onStoryCreated={fetchBacklogDetails}
      />

      {/* User Story Detail Modal */}
      <UserStoryDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        userStory={selectedUserStory}
        projectId={project.id}
      />
    </div>
  )
}
