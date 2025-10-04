"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Calendar, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { SprintCard } from "@/components/sprints/sprint-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Sprint {
  id: string
  name: string
  projectId: string
  projectName: string
  startDate: string
  endDate: string
  goal: string
  userStories: string[]
  tasks: string[]
  status: "planning" | "active" | "completed"
  createdBy: string
  createdAt: string
}

export default function SprintsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sprintsRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sprints`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`),
      ])

      const sprintsData = await sprintsRes.json()
      const projectsData = await projectsRes.json()

      // Enrich sprints with project names
      const enrichedSprints = sprintsData.map((sprint: Sprint) => {
        const project = projectsData.find((p: any) => p.id === sprint.projectId)
        return {
          ...sprint,
          projectName: project?.name || "Proyecto desconocido",
        }
      })

      setSprints(enrichedSprints)
      setProjects(projectsData)
    } catch (error) {
      console.error("[v0] Error fetching sprints:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los sprints",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSprints = sprints.filter((sprint) => {
    const matchesSearch = sprint.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || sprint.status === filterStatus
    const matchesProject = filterProject === "all" || sprint.projectId === filterProject
    return matchesSearch && matchesStatus && matchesProject
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sprints</h1>
          <p className="mt-2 text-muted-foreground">Planifica y gestiona tus sprints</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Sprint
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar sprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="planning">Planificación</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sprints List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery || filterStatus !== "all" || filterProject !== "all"
                ? "No se encontraron sprints"
                : "No tienes sprints aún"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery || filterStatus !== "all" || filterProject !== "all"
                ? "Intenta ajustar los filtros"
                : "Crea tu primer sprint para comenzar"}
            </p>
            {!searchQuery && filterStatus === "all" && filterProject === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar con IA
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} onUpdate={fetchData} />
          ))}
        </div>
      )}

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projects={projects}
        onSprintCreated={fetchData}
      />
    </div>
  )
}
