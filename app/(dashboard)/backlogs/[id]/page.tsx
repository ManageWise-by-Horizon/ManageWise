"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Sparkles, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { UserStoryCard } from "@/components/backlogs/user-story-card"
import { CreateUserStoryDialog } from "@/components/backlogs/create-user-story-dialog"

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: "high" | "medium" | "low"
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

  useEffect(() => {
    fetchBacklogDetails()
  }, [resolvedParams.id])

  const fetchBacklogDetails = async () => {
    try {
      const backlogRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${resolvedParams.id}`)
      const backlogData = await backlogRes.json()
      setBacklog(backlogData)

      // Fetch project
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${backlogData.projectId}`)
      const projectData = await projectRes.json()
      setProject(projectData)

      // Fetch user stories
      const storiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories`)
      const storiesData = await storiesRes.json()
      const backlogStories = storiesData.filter((s: UserStory) => backlogData.items.includes(s.id))
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
    const high = userStories.filter((s) => s.priority === "high").length
    const medium = userStories.filter((s) => s.priority === "medium").length
    const low = userStories.filter((s) => s.priority === "low").length
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

      {/* User Stories List */}
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
          <div className="space-y-4">
            {userStories
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map((story) => (
                <UserStoryCard key={story.id} story={story} onUpdate={fetchBacklogDetails} />
              ))}
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
    </div>
  )
}
