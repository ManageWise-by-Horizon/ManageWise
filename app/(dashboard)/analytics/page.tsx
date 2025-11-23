"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  Users,
  BarChart3,
  FolderKanban,
  Target,
  ListTodo,
  Zap,
} from "lucide-react"
import { useProjects } from "@/lib/domain/projects/hooks/use-projects"
import { projectService } from "@/lib/domain/projects/services/project.service"
import { taskService } from "@/lib/domain/tasks/services/task.service"
import { okrService } from "@/lib/domain/okrs/services/okr.service"
import { userStoryService } from "@/lib/domain/user-stories/services/user-story.service"
import { meetingService } from "@/lib/domain/meetings/services/meeting.service"
import { getApiClient } from "@/lib/infrastructure/api/api-client"
import type { Project } from "@/lib/domain/projects/types/project.types"
import type { Task } from "@/lib/domain/tasks/types/task.types"
import type { Okr } from "@/lib/domain/okrs/types/okr.types"
import type { UserStory } from "@/lib/domain/user-stories/types/user-story.types"
import type { Meeting } from "@/lib/domain/meetings/types/meeting.types"
import { format, differenceInDays, parseISO, isAfter, isBefore } from "date-fns"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Sprint {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
  projectId: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { projects, isLoading: projectsLoading } = useProjects()
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  
  // Datos
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [allSprints, setAllSprints] = useState<Sprint[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allOkrs, setAllOkrs] = useState<Okr[]>([])
  const [allUserStories, setAllUserStories] = useState<UserStory[]>([])
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    loadAllData()
  }, [projects])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const apiClient = getApiClient()
      
      // Cargar todos los datos en paralelo
      const [projectsData, tasksData, userStoriesData, meetingsData] = await Promise.all([
        user?.id ? projectService.getProjectsByUserId(user.id) : projectService.getAllProjects(),
        taskService.getAllTasks(),
        userStoryService.getAllUserStories(),
        meetingService.getAllMeetings(),
      ])

      setAllProjects(projectsData)
      setAllTasks(tasksData)
      setAllUserStories(userStoriesData)
      setAllMeetings(meetingsData)

      // Cargar OKRs de todos los proyectos
      const okrsPromises = projectsData.map(project =>
        okrService.getOkrsByProjectId(project.projectId).catch(() => [])
      )
      const okrsArrays = await Promise.all(okrsPromises)
      setAllOkrs(okrsArrays.flat())

      // Cargar sprints de todos los proyectos
      const sprintsPromises = projectsData.map(project =>
        apiClient.get<Sprint[]>(`/api/v1/sprints/project/${project.projectId}`).catch(() => [])
      )
      const sprintsArrays = await Promise.all(sprintsPromises)
      setAllSprints(sprintsArrays.flat())
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar datos por proyecto seleccionado
  const filteredData = useMemo(() => {
    if (selectedProject === "all") {
      return {
        projects: allProjects,
        sprints: allSprints,
        tasks: allTasks,
        okrs: allOkrs,
        userStories: allUserStories,
        meetings: allMeetings,
      }
    }

    const projectId = selectedProject
    return {
      projects: allProjects.filter(p => String(p.projectId) === projectId),
      sprints: allSprints.filter(s => s.projectId === projectId),
      tasks: allTasks.filter(t => {
        const userStory = allUserStories.find(us => us.id === t.userStoryId)
        return userStory && String(userStory.projectId) === projectId
      }),
      okrs: allOkrs.filter(o => String(o.projectId) === projectId),
      userStories: allUserStories.filter(us => String(us.projectId) === projectId),
      meetings: allMeetings.filter(m => m.projectId === projectId),
    }
  }, [selectedProject, allProjects, allSprints, allTasks, allOkrs, allUserStories, allMeetings])

  if (!user) return null

  // ========== MÉTRICAS DE PROYECTOS ==========
  const projectMetrics = useMemo(() => {
    const { projects } = filteredData
    const total = projects.length
    const byStatus = {
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
      paused: projects.filter(p => p.status === "paused").length,
      planning: projects.filter(p => p.status === "planning").length,
      draft: projects.filter(p => p.status === "draft").length,
      cancelled: projects.filter(p => p.status === "cancelled").length,
    }
    
    const today = new Date()
    const upcoming = projects.filter(p => {
      if (!p.endDate) return false
      const endDate = parseISO(p.endDate)
      const daysUntilEnd = differenceInDays(endDate, today)
      return daysUntilEnd >= 0 && daysUntilEnd <= 30
    }).length

    const overdue = projects.filter(p => {
      if (!p.endDate) return false
      return isBefore(parseISO(p.endDate), today) && p.status !== "completed"
    }).length

    return { total, byStatus, upcoming, overdue }
  }, [filteredData])

  // ========== MÉTRICAS DE SPRINTS ==========
  const sprintMetrics = useMemo(() => {
    const { sprints } = filteredData
    const total = sprints.length
    const completed = sprints.filter(s => s.status === "COMPLETED" || s.status === "completed").length
    const inProgress = sprints.filter(s => s.status === "IN_PROGRESS" || s.status === "in_progress").length
    const planned = sprints.filter(s => s.status === "PLANNED" || s.status === "planned").length
    
    // Calcular velocidad (story points completados por sprint)
    const sprintsWithDates = sprints.filter(s => s.startDate && s.endDate)
    const completedSprints = sprintsWithDates.filter(s => 
      s.status === "COMPLETED" || s.status === "completed"
    )
    
    // Obtener user stories de sprints completados
    const userStoriesInCompletedSprints = filteredData.userStories.filter(us => 
      completedSprints.some(s => s.id === us.sprintId)
    )
    const totalStoryPoints = userStoriesInCompletedSprints.reduce((sum, us) => sum + (us.storyPoints || 0), 0)
    const averageVelocity = completedSprints.length > 0 ? totalStoryPoints / completedSprints.length : 0

    // Sprints atrasados
    const today = new Date()
    const overdue = sprints.filter(s => {
      if (!s.endDate) return false
      const endDate = parseISO(s.endDate)
      return isBefore(endDate, today) && (s.status === "IN_PROGRESS" || s.status === "in_progress")
    }).length

    return { total, completed, inProgress, planned, averageVelocity, overdue }
  }, [filteredData])

  // ========== MÉTRICAS DE OKRs ==========
  const okrMetrics = useMemo(() => {
    const { okrs } = filteredData
    const total = okrs.length
    const avgProgress = okrs.length > 0
      ? okrs.reduce((sum, o) => sum + (o.progress || 0), 0) / okrs.length
      : 0
    
    const byStatus = {
      notStarted: okrs.filter(o => o.status === "NOT_STARTED").length,
      inProgress: okrs.filter(o => o.status === "IN_PROGRESS").length,
      completed: okrs.filter(o => o.status === "COMPLETED").length,
      onTrack: okrs.filter(o => {
        const progress = typeof o.progress === "number" ? o.progress : 0
        return progress >= 50 && progress < 100
      }).length,
      atRisk: okrs.filter(o => {
        const progress = typeof o.progress === "number" ? o.progress : 0
        return progress < 50 && progress > 0
      }).length,
    }

    const byType = {
      individual: okrs.filter(o => o.type === "INDIVIDUAL").length,
      company: okrs.filter(o => o.type === "COMPANY").length,
      team: okrs.filter(o => o.type === "TEAM").length,
    }

    const today = new Date()
    const upcoming = okrs.filter(o => {
      if (!o.endDate) return false
      const endDate = parseISO(o.endDate)
      const daysUntilEnd = differenceInDays(endDate, today)
      return daysUntilEnd >= 0 && daysUntilEnd <= 30
    }).length

    return { total, avgProgress, byStatus, byType, upcoming }
  }, [filteredData])

  // ========== MÉTRICAS DE TAREAS ==========
  const taskMetrics = useMemo(() => {
    const { tasks } = filteredData
    const total = tasks.length
    const completed = tasks.filter(t => t.status === "DONE").length
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length
    const todo = tasks.filter(t => t.status === "TODO").length
    
    const byPriority = {
      alta: tasks.filter(t => t.priority === "ALTA").length,
      media: tasks.filter(t => t.priority === "MEDIA").length,
      baja: tasks.filter(t => t.priority === "BAJA").length,
    }

    const unassigned = tasks.filter(t => !t.assignedTo || t.assignedTo.trim() === "").length

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
    const completedEstimatedHours = tasks
      .filter(t => t.status === "DONE")
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0)

    return { total, completed, inProgress, todo, byPriority, unassigned, totalEstimatedHours, completedEstimatedHours }
  }, [filteredData])

  // ========== MÉTRICAS DE USER STORIES ==========
  const userStoryMetrics = useMemo(() => {
    const { userStories } = filteredData
    const total = userStories.length
    const byStatus = {
      todo: userStories.filter(us => us.status === "todo" || us.status === "TODO").length,
      inProgress: userStories.filter(us => us.status === "in_progress" || us.status === "IN_PROGRESS").length,
      done: userStories.filter(us => us.status === "done" || us.status === "DONE").length,
    }

    const byPriority = {
      alta: userStories.filter(us => us.priority === "Alta" || us.priority === "ALTA").length,
      media: userStories.filter(us => us.priority === "Media" || us.priority === "MEDIA").length,
      baja: userStories.filter(us => us.priority === "Baja" || us.priority === "BAJA").length,
    }

    const totalStoryPoints = userStories.reduce((sum, us) => sum + (us.storyPoints || 0), 0)
    const completedStoryPoints = userStories
      .filter(us => us.status === "done" || us.status === "DONE")
      .reduce((sum, us) => sum + (us.storyPoints || 0), 0)

    const withoutTasks = userStories.filter(us => {
      return !filteredData.tasks.some(t => t.userStoryId === us.id)
    }).length

    return { total, byStatus, byPriority, totalStoryPoints, completedStoryPoints, withoutTasks }
  }, [filteredData])

  // ========== MÉTRICAS DE EQUIPO ==========
  const teamMetrics = useMemo(() => {
    const { tasks } = filteredData
    const memberStats: Record<string, { tasksCompleted: number; tasksInProgress: number; totalHours: number }> = {}
    
    tasks.forEach(task => {
      if (!task.assignedTo) return
      if (!memberStats[task.assignedTo]) {
        memberStats[task.assignedTo] = { tasksCompleted: 0, tasksInProgress: 0, totalHours: 0 }
      }
      if (task.status === "DONE") {
        memberStats[task.assignedTo].tasksCompleted++
      }
      if (task.status === "IN_PROGRESS") {
        memberStats[task.assignedTo].tasksInProgress++
      }
      memberStats[task.assignedTo].totalHours += task.estimatedHours || 0
    })

    const topPerformers = Object.entries(memberStats)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 5)

    return { memberStats, topPerformers }
  }, [filteredData])

  // ========== MÉTRICAS DE REUNIONES ==========
  const meetingMetrics = useMemo(() => {
    const { meetings } = filteredData
    const total = meetings.length
    const scheduled = meetings.filter(m => m.status === "SCHEDULED" || m.status === "scheduled").length
    const completed = meetings.filter(m => m.status === "COMPLETED" || m.status === "completed").length
    const cancelled = meetings.filter(m => m.status === "CANCELLED" || m.status === "cancelled").length

    const today = new Date()
    const upcoming = meetings.filter(m => {
      if (!m.startDate) return false
      const startDate = parseISO(m.startDate)
      return isAfter(startDate, today) && (m.status === "SCHEDULED" || m.status === "scheduled")
    }).length

    return { total, scheduled, completed, cancelled, upcoming }
  }, [filteredData])

  // ========== DATOS PARA GRÁFICOS ==========
  const projectsByStatusData = [
    { name: "Activos", value: projectMetrics.byStatus.active, color: "#10b981" },
    { name: "Completados", value: projectMetrics.byStatus.completed, color: "#3b82f6" },
    { name: "Pausados", value: projectMetrics.byStatus.paused, color: "#f59e0b" },
    { name: "Planificación", value: projectMetrics.byStatus.planning, color: "#8b5cf6" },
    { name: "Borrador", value: projectMetrics.byStatus.draft, color: "#6b7280" },
    { name: "Cancelados", value: projectMetrics.byStatus.cancelled, color: "#ef4444" },
  ].filter(item => item.value > 0)

  const tasksByStatusData = [
    { name: "Completadas", value: taskMetrics.completed, color: "#10b981" },
    { name: "En Progreso", value: taskMetrics.inProgress, color: "#3b82f6" },
    { name: "Por Hacer", value: taskMetrics.todo, color: "#6b7280" },
  ]

  const okrProgressData = [
    { name: "Completados", value: okrMetrics.byStatus.completed, color: "#10b981" },
    { name: "En Progreso", value: okrMetrics.byStatus.inProgress, color: "#3b82f6" },
    { name: "No Iniciados", value: okrMetrics.byStatus.notStarted, color: "#6b7280" },
  ]

  const velocityData = useMemo(() => {
    const { sprints } = filteredData
    const completedSprints = sprints
      .filter(s => (s.status === "COMPLETED" || s.status === "completed") && s.startDate && s.endDate)
      .sort((a, b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime())
      .slice(-6) // Últimos 6 sprints

    return completedSprints.map(sprint => {
      const userStories = filteredData.userStories.filter(us => us.sprintId === sprint.id)
      const storyPoints = userStories.reduce((sum, us) => sum + (us.storyPoints || 0), 0)
      return {
        name: sprint.title,
        velocity: storyPoints,
      }
    })
  }, [filteredData])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Análisis y métricas de tus proyectos</p>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {allProjects.map(project => (
                <SelectItem key={project.projectId} value={project.projectId}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban className="w-4 h-4 mr-2" />
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="sprints">
              <Zap className="w-4 h-4 mr-2" />
              Sprints
            </TabsTrigger>
            <TabsTrigger value="okrs">
              <Target className="w-4 h-4 mr-2" />
              OKRs
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="w-4 h-4 mr-2" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Equipo
            </TabsTrigger>
          </TabsList>

          {/* TAB: RESUMEN */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectMetrics.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {projectMetrics.byStatus.active} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sprints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sprintMetrics.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sprintMetrics.completed} completados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">OKRs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{okrMetrics.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {okrMetrics.avgProgress.toFixed(1)}% progreso promedio
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{taskMetrics.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taskMetrics.completed} completadas
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proyectos por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={projectsByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Velocidad del Equipo (Últimos 6 Sprints)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: PROYECTOS */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectMetrics.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green">{projectMetrics.byStatus.active}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Próximos a Vencer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">{projectMetrics.upcoming}</div>
                  <p className="text-xs text-muted-foreground mt-1">En los próximos 30 días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{projectMetrics.overdue}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Proyectos por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={projectsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: SPRINTS */}
          <TabsContent value="sprints" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sprints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sprintMetrics.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green">{sprintMetrics.completed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sprintMetrics.averageVelocity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Story points/sprint</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Atrasados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{sprintMetrics.overdue}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Velocidad del Equipo</CardTitle>
                <CardDescription>Tendencia de velocidad en los últimos sprints</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={2} name="Story Points" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: OKRs */}
          <TabsContent value="okrs" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total OKRs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{okrMetrics.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Progreso Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{okrMetrics.avgProgress.toFixed(1)}%</div>
                  <Progress value={okrMetrics.avgProgress} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green">{okrMetrics.byStatus.completed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">{okrMetrics.byStatus.atRisk}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OKRs por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={okrProgressData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {okrProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OKRs por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: "Individual", value: okrMetrics.byType.individual },
                      { name: "Compañía", value: okrMetrics.byType.company },
                      { name: "Equipo", value: okrMetrics.byType.team },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: TAREAS */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{taskMetrics.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green">{taskMetrics.completed}</div>
                  <Progress value={(taskMetrics.completed / taskMetrics.total) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sin Asignar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">{taskMetrics.unassigned}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Horas Estimadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{taskMetrics.totalEstimatedHours.toFixed(0)}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taskMetrics.completedEstimatedHours.toFixed(0)}h completadas
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tareas por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={tasksByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tasksByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tareas por Prioridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: "Alta", value: taskMetrics.byPriority.alta },
                      { name: "Media", value: taskMetrics.byPriority.media },
                      { name: "Baja", value: taskMetrics.byPriority.baja },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total User Stories</p>
                    <p className="text-2xl font-bold">{userStoryMetrics.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Story Points</p>
                    <p className="text-2xl font-bold">{userStoryMetrics.totalStoryPoints}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Story Points Completados</p>
                    <p className="text-2xl font-bold text-green">{userStoryMetrics.completedStoryPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: EQUIPO */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Miembros del equipo con más tareas completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMetrics.topPerformers.length > 0 ? (
                    teamMetrics.topPerformers.map((member, index) => (
                      <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold">Usuario {member.userId.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.tasksCompleted} tareas completadas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Horas estimadas</p>
                          <p className="font-bold">{member.totalHours.toFixed(0)}h</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Reuniones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Reuniones</p>
                    <p className="text-2xl font-bold">{meetingMetrics.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Programadas</p>
                    <p className="text-2xl font-bold">{meetingMetrics.scheduled}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completadas</p>
                    <p className="text-2xl font-bold text-green">{meetingMetrics.completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Próximas</p>
                    <p className="text-2xl font-bold text-blue">{meetingMetrics.upcoming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
