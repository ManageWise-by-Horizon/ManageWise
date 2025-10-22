"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { cascadeDeleteProject } from "@/lib/cascade-delete"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderKanban, Users, Calendar, MoreVertical, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

interface Project {
  id: string
  name: string
  description: string
  objectives: string[]
  timeline: {
    start: string
    end: string
  }
  members: string[]
  createdBy: string
  createdAt: string
  status: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`)
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("[v0] Error fetching projects:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Mostrar toast de progreso
      toast({
        title: "Eliminando proyecto",
        description: "Eliminando proyecto y todas las entidades relacionadas...",
      })

      // Usar la función de eliminación en cascada
      const result = await cascadeDeleteProject({
        projectId,
        apiUrl: process.env.NEXT_PUBLIC_API_URL!,
        onProgress: (entity, count) => {
          console.log(`Eliminadas ${count} entidades de tipo ${entity}`);
        },
        onError: (entity, error) => {
          console.error(`Error eliminando ${entity}:`, error);
        }
      });

      if (result.success) {
        // Actualizar el estado local
        setProjects(projects.filter((p) => p.id !== projectId))

        // Mostrar resumen de eliminación
        const totalDeleted = Object.values(result.deletedEntities).reduce((sum, count) => sum + count, 0);
        
        toast({
          title: "Proyecto eliminado exitosamente",
          description: `Proyecto y ${totalDeleted} entidades relacionadas eliminadas`,
        })
      } else {
        // Mostrar errores pero indicar eliminación parcial
        const totalDeleted = Object.values(result.deletedEntities).reduce((sum, count) => sum + count, 0);
        
        toast({
          title: "Proyecto eliminado con advertencias",
          description: `Se eliminaron ${totalDeleted} entidades, pero hubo ${result.errors.length} errores`,
          variant: "destructive",
        })

        // Aún así actualizar la lista de proyectos
        setProjects(projects.filter((p) => p.id !== projectId))
      }

    } catch (error) {
      console.error("[v0] Error deleting project:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto completamente",
        variant: "destructive",
      })
    }
  }

  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="mt-2 text-muted-foreground">Gestiona tus proyectos y equipos</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery ? "No se encontraron proyectos" : "No tienes proyectos aún"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery ? "Intenta con otra búsqueda" : "Crea tu primer proyecto para comenzar"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-chart-1 hover:bg-chart-1/90">
                <Plus className="mr-2 h-4 w-4" />
                Crear Proyecto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">{project.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={project.status === "active" ? "default" : "secondary"}>
                    {project.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(project.timeline.start)} - {formatDate(project.timeline.end)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.members.length} miembros</span>
                  </div>
                </div>

                <Link href={`/projects/${project.id}`}>
                  <Button className="w-full bg-transparent" variant="outline">
                    Ver Proyecto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
