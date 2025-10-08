"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, ListTodo, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateBacklogDialog } from "@/components/backlogs/create-backlog-dialog"
import { BacklogCard } from "@/components/backlogs/backlog-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Backlog {
  id: string
  projectId: string
  projectName: string
  type: "product" | "sprint"
  items: string[]
  createdBy: string
  createdAt: string
  status: string
}

export default function BacklogsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [backlogs, setBacklogs] = useState<Backlog[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "product" | "sprint">("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [backlogsRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`),
      ])

      const backlogsData = await backlogsRes.json()
      const projectsData = await projectsRes.json()

      // Filter only backlog containers (items with 'type' and 'items' fields)
      // Ignore individual User Stories
      const backlogContainers = backlogsData.filter((item: any) => item.type && item.items)

      // Enrich backlogs with project names
      const enrichedBacklogs = backlogContainers.map((backlog: Backlog) => {
        const project = projectsData.find((p: any) => p.id === backlog.projectId)
        return {
          ...backlog,
          projectName: project?.name || "Proyecto desconocido",
        }
      })

      setBacklogs(enrichedBacklogs)
      setProjects(projectsData)
    } catch (error) {
      console.error("[v0] Error fetching backlogs:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los backlogs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredBacklogs = backlogs.filter((backlog) => {
    const matchesSearch = backlog.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || backlog.type === filterType
    const matchesProject = filterProject === "all" || backlog.projectId === filterProject
    return matchesSearch && matchesType && matchesProject
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backlogs</h1>
          <p className="mt-2 text-muted-foreground">Gestiona product backlogs y sprint backlogs</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Backlog
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar backlogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="product">Product Backlog</SelectItem>
              <SelectItem value="sprint">Sprint Backlog</SelectItem>
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

      {/* Backlogs List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
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
      ) : filteredBacklogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListTodo className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery || filterType !== "all" || filterProject !== "all"
                ? "No se encontraron backlogs"
                : "No tienes backlogs aún"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery || filterType !== "all" || filterProject !== "all"
                ? "Intenta ajustar los filtros"
                : "Crea tu primer backlog para comenzar"}
            </p>
            {!searchQuery && filterType === "all" && filterProject === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar con IA
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBacklogs.map((backlog) => (
            <BacklogCard key={backlog.id} backlog={backlog} onUpdate={fetchData} />
          ))}
        </div>
      )}

      {/* Create Backlog Dialog */}
      <CreateBacklogDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projects={projects}
        onBacklogCreated={fetchData}
      />
    </div>
  )
}
