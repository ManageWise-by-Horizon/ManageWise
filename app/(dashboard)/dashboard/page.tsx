"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, ListTodo, CheckCircle2, TrendingUp, Users, Zap, ArrowRight, Calendar, BarChart3, Target, Bell, Plus, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useProjects } from "@/lib/domain/projects/hooks/use-projects"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { taskService } from "@/lib/domain/tasks/services/task.service"
import { getProjectStatusLabel } from "@/lib/domain/projects/utils/project-status.utils"
import type { Project } from "@/lib/domain/projects/types/project.types"
import type { Task } from "@/lib/domain/tasks/types/task.types"

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  completedTasks: number
  upcomingMeetings: number
  tokensUsed: number
  tokensLimit: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects: allProjects, isLoading: projectsLoading, refetch: refetchProjects } = useProjects()
  const [projects, setProjects] = useState<Project[]>([])
  const [greeting, setGreeting] = useState("") // Estado para el saludo
  const [isClient, setIsClient] = useState(false) // Para evitar hidratación
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingMeetings: 0,
    tokensUsed: 0, // Inicializar siempre con 0
    tokensLimit: 100, // Inicializar siempre con 100
  })
  const [pendingTasks, setPendingTasks] = useState(0)
  const [inProgressTasks, setInProgressTasks] = useState(0)

  // useEffect para marcar que estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // useEffect para generar el saludo solo en el cliente
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Buenos días")
    else if (hour < 18) setGreeting("Buenas tardes")
    else setGreeting("Buenas noches")
  }, [])

  // Filtrar proyectos del usuario cuando cambien los proyectos o el usuario
  useEffect(() => {
    if (!user || !allProjects) {
      setProjects([])
      return
    }

    // Asegurar que allProjects sea un array
    const projectsArray = Array.isArray(allProjects) ? allProjects : []
    
    // Filtrar solo proyectos donde el usuario es miembro
    const userProjects = projectsArray.filter((p: Project) => 
      p.members && p.members.includes(user.id)
    )
    
    setProjects(userProjects)

    // Actualizar estadísticas básicas
    setStats(prev => ({
      ...prev,
      totalProjects: userProjects.length,
      activeProjects: userProjects.filter((p: Project) => p.status === "active").length,
      tokensUsed: user?.subscription.tokensUsed || 0,
      tokensLimit: user?.subscription.tokensLimit || 100,
    }))
  }, [allProjects, user])

  // Cargar tareas del usuario
  useEffect(() => {
    const loadUserTasks = async () => {
      if (!user?.id) {
        setStats(prev => ({
          ...prev,
          totalTasks: 0,
          completedTasks: 0,
        }))
        return
      }

      try {
        const userTasks = await taskService.getTasksByUserId(user.id)
        const completedTasks = userTasks.filter((task: Task) => task.status === 'DONE')
        const pendingTasks = userTasks.filter((task: Task) => task.status === 'TODO')
        const inProgressTasks = userTasks.filter((task: Task) => task.status === 'IN_PROGRESS')
        
        setStats(prev => ({
          ...prev,
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
        }))
        setPendingTasks(pendingTasks.length)
        setInProgressTasks(inProgressTasks.length)
      } catch (error) {
        console.error('Error loading user tasks:', error)
        // En caso de error, mantener los valores por defecto (0)
        setStats(prev => ({
          ...prev,
          totalTasks: 0,
          completedTasks: 0,
        }))
        setPendingTasks(0)
        setInProgressTasks(0)
      }
    }

    loadUserTasks()
  }, [user])

  const taskCompletionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0
  const tokenUsageRate = stats.tokensLimit > 0 ? (stats.tokensUsed / stats.tokensLimit) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting && `${greeting}, `}{isClient ? user?.name : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">Aquí está el resumen de tus proyectos y tareas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">de {stats.totalProjects} totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">de {stats.totalTasks} totales</p>
            <Progress value={taskCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniones Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens IA</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isClient && user?.subscription.plan === "premium" ? "∞" : `${stats.tokensUsed}/${stats.tokensLimit}`}
            </div>
            {isClient && user?.subscription.plan === "free" && (
              <>
                <p className="text-xs text-muted-foreground">tokens usados</p>
                <Progress value={tokenUsageRate} className="mt-2" />
              </>
            )}
            {isClient && user?.subscription.plan === "premium" && <p className="text-xs text-muted-foreground">ilimitados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proyectos Recientes</CardTitle>
                <CardDescription>Tus proyectos más activos</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No tienes proyectos aún</p>
                <Link href="/projects">
                  <Button className="mt-4" size="sm">
                    Crear Proyecto
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                        <FolderKanban className="h-5 w-5 text-chart-1" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getProjectStatusLabel(project.status)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {project.members ? project.members.length : 0}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link href={`/projects/${project.projectId}`}>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede a las funciones más usadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Crear Proyecto */}
              <Button 
                className="h-auto flex-col items-start p-4 hover:bg-primary/5 hover:border-primary/20 transition-all" 
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <div className="flex items-center gap-2 w-full mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Nuevo Proyecto</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-left w-full">Crear un proyecto desde cero</p>
              </Button>

              {/* Generar con IA */}
              <Link href="/chat" className="block">
                <Button className="h-auto flex-col items-start p-4 w-full hover:bg-primary/5 hover:border-primary/20 transition-all" variant="outline">
                  <div className="flex items-center gap-2 w-full mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Generar con IA</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-left w-full">Asistente inteligente</p>
                </Button>
              </Link>

              {/* Analytics */}
              <Link href="/analytics" className="block">
                <Button className="h-auto flex-col items-start p-4 w-full hover:bg-primary/5 hover:border-primary/20 transition-all" variant="outline">
                  <div className="flex items-center gap-2 w-full mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Analytics</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-left w-full">Métricas y estadísticas</p>
                </Button>
              </Link>

              {/* Notificaciones */}
              <Link href="/notifications" className="block">
                <Button className="h-auto flex-col items-start p-4 w-full hover:bg-primary/5 hover:border-primary/20 transition-all relative" variant="outline">
                  <div className="flex items-center gap-2 w-full mb-2">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Bell className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Notificaciones</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-left w-full">Ver alertas y avisos</p>
                </Button>
              </Link>
            </div>

            {/* Acciones secundarias */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
                    Proyectos
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Bell className="mr-1.5 h-3.5 w-3.5" />
                    Notificaciones
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={() => {
          refetchProjects()
        }}
      />

      {/* Upgrade Banner for Free Users */}
      {isClient && user?.subscription.plan === "free" && tokenUsageRate > 70 && (
        <Card className="border-chart-1 bg-chart-1/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Estás cerca del límite de tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Actualiza a Premium para tokens ilimitados y más funciones
                </p>
              </div>
            </div>
            <Link href="/subscription">
              <Button className="bg-chart-1 hover:bg-chart-1/90">Actualizar a Premium</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
