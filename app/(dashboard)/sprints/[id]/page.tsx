"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Target, ListTodo, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { TaskBoard } from "@/components/sprints/task-board"

interface Sprint {
  id: string
  name: string
  projectId: string
  startDate: string
  endDate: string
  goal: string
  userStories: string[]
  tasks: string[]
  status: "planning" | "active" | "completed"
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "done"
  assignedTo: string
  priority: string
  estimatedHours: number
  aiAssigned?: boolean
}

export default function SprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const { toast } = useToast()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSprintDetails()
  }, [resolvedParams.id])

  const fetchSprintDetails = async () => {
    try {
      const sprintRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sprints/${resolvedParams.id}`)
      const sprintData = await sprintRes.json()
      setSprint(sprintData)

      // Fetch project
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${sprintData.projectId}`)
      const projectData = await projectRes.json()
      setProject(projectData)

      // Fetch tasks
      const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`)
      const tasksData = await tasksRes.json()
      const sprintTasks = tasksData.filter((t: Task) => sprintData.tasks.includes(t.id))
      setTasks(sprintTasks)
    } catch (error) {
      console.error("[v0] Error fetching sprint details:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el sprint",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planning: { label: "Planificación", color: "bg-chart-4" },
      active: { label: "Activo", color: "bg-chart-3" },
      completed: { label: "Completado", color: "bg-chart-2" },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: "bg-muted" }
  }

  const getTaskStats = () => {
    const todo = tasks.filter((t) => t.status === "todo").length
    const inProgress = tasks.filter((t) => t.status === "in_progress").length
    const done = tasks.filter((t) => t.status === "done").length
    return { todo, inProgress, done }
  }

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

  if (!sprint || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold">Sprint no encontrado</h2>
        <Link href="/sprints">
          <Button className="mt-4">Volver a Sprints</Button>
        </Link>
      </div>
    )
  }

  const statusBadge = getStatusBadge(sprint.status)
  const taskStats = getTaskStats()
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  const aiAssignedCount = tasks.filter((t) => t.aiAssigned).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sprints">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{sprint.name}</h1>
              <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-medium">{formatDate(sprint.startDate)}</p>
              <p className="text-muted-foreground">hasta {formatDate(sprint.endDate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">{totalHours} horas estimadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.done}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.inProgress} en progreso, {taskStats.todo} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignación IA</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiAssignedCount}</div>
            <p className="text-xs text-muted-foreground">tareas asignadas por IA</p>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Goal */}
      <Card>
        <CardHeader>
          <CardTitle>Objetivo del Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{sprint.goal}</p>
        </CardContent>
      </Card>

      {/* Task Board */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Tablero Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListTodo className="mr-2 h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <TaskBoard tasks={tasks} onUpdate={fetchSprintDetails} />
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ListTodo className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vista de Lista</h3>
              <p className="text-sm text-muted-foreground">Próximamente: Lista detallada de tareas</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
