"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, ListTodo, CheckCircle2, TrendingUp, Users, Zap, ArrowRight, Calendar } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Project {
  id: string
  name: string
  status: string
  members: string[]
}

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
  const [projects, setProjects] = useState<Project[]>([])
  const [greeting, setGreeting] = useState("") // Estado para el saludo
  const [isClient, setIsClient] = useState(false) // Para evitar hidratación
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingMeetings: 0,
    tokensUsed: 0, // Inicializar siempre con 0
    tokensLimit: 100, // Inicializar siempre con 100
  })

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`)
        const projectsData = await projectsRes.json()
        setProjects(projectsData)

        const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`)
        const tasksData = await tasksRes.json()

        const meetingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meetings`)
        const meetingsData = await meetingsRes.json()

        setStats({
          totalProjects: projectsData.length,
          activeProjects: projectsData.filter((p: Project) => p.status === "active").length,
          totalTasks: tasksData.length,
          completedTasks: tasksData.filter((t: any) => t.status === "done").length,
          upcomingMeetings: meetingsData.filter((m: any) => new Date(m.date) > new Date()).length,
          tokensUsed: user?.subscription.tokensUsed || 0,
          tokensLimit: user?.subscription.tokensLimit || 100,
        })
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      }
    }

    fetchDashboardData()
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
                    key={project.id}
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
                            {project.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {project.members.length}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link href={`/projects/${project.id}`}>
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
          <CardContent className="space-y-3">
            <Link href="/projects/new">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FolderKanban className="mr-2 h-4 w-4" />
                Crear Nuevo Proyecto
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                Generar con IA
              </Button>
            </Link>
            <Link href="/projects">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <ListTodo className="mr-2 h-4 w-4" />
                Ver Proyectos
              </Button>
            </Link>
            <Link href="/calendar">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Calendario
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

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
