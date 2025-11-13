"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderKanban, Users, Calendar, MoreVertical, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog"
import { createApiUrl } from "@/lib/api-config"

type ProjectRole = 'scrum_master' | 'product_owner' | 'developer' | 'tester' | 'designer' | 'stakeholder'

interface Project {
  id: number | string  // Soportar Long del backend y string del db.json
  projectId?: string   // UUID del proyecto (backend Java)
  name: string
  description?: string
  objectives?: string[]
  timeline?: {
    start: string
    end: string
  }
  members: string[]
  createdBy?: string
  createdAt?: string
  status: string
  startDate?: string   // Backend Java
  endDate?: string     // Backend Java
  ownerId?: string     // Backend Java
}

interface ProjectPermission {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  read: boolean
  write: boolean
  manage_project: boolean
  manage_members: boolean
  manage_permissions: boolean
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectPermissions, setProjectPermissions] = useState<Record<string, ProjectPermission>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch(createApiUrl('/projects'))
      const data = await response.json()
      
      // Validar que data es un array
      const safeProjects = Array.isArray(data) ? data : []
      setProjects(safeProjects)

      // Obtener permisos del usuario para cada proyecto
      if (user) {
        const permissionsPromises = safeProjects.map(async (project: Project) => {
          const permResponse = await fetch(
            createApiUrl(`/projectPermissions?projectId=${project.id}&userId=${user.id}`)
          )
          const perms = await permResponse.json()
          return { projectId: String(project.id), permission: perms[0] }
        })

        const permissionsResults = await Promise.all(permissionsPromises)
        const permissionsMap = permissionsResults.reduce((acc, { projectId, permission }) => {
          if (permission) {
            acc[projectId] = permission
          }
          return acc
        }, {} as Record<string, ProjectPermission>)

        setProjectPermissions(permissionsMap)
      }
    } catch (error) {
      console.error("[v0] Error fetching projects:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos",
        variant: "destructive",
      })
      // Establecer array vacío en caso de error
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSuccess = () => {
    // Refresh the projects list
    fetchProjects()
  }

  const getRoleLabel = (role: ProjectRole) => {
    const roleLabels: Record<ProjectRole, string> = {
      scrum_master: 'Scrum Master',
      product_owner: 'Product Owner',
      developer: 'Developer',
      tester: 'Tester',
      designer: 'Designer',
      stakeholder: 'Stakeholder'
    }
    return roleLabels[role] || role
  }

  const getRoleBadgeColor = (role: ProjectRole) => {
    const roleColors: Record<ProjectRole, string> = {
      scrum_master: 'bg-chart-1 text-white',
      product_owner: 'bg-chart-2 text-white',
      developer: 'bg-chart-3 text-white',
      tester: 'bg-chart-4 text-white',
      designer: 'bg-chart-5 text-white',
      stakeholder: 'bg-blue-100 text-blue-800'
    }
    return roleColors[role] || 'bg-gray-100 text-gray-800'
  }

  const filteredProjects = projects
    .filter((project) => {
      // Filtrar solo proyectos donde el usuario es miembro
      if (!user) return false
      return project.members.includes(user.id)
    })
    .filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
                      <DropdownMenuItem 
                        onClick={() => setProjectToDelete({ id: String(project.id), name: project.name })} 
                        className="text-destructive"
                      >
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
                  {projectPermissions[project.id] && (
                    <Badge className={getRoleBadgeColor(projectPermissions[project.id].role)}>
                      {getRoleLabel(projectPermissions[project.id].role)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {project.timeline 
                        ? `${formatDate(project.timeline.start)} - ${formatDate(project.timeline.end)}`
                        : project.startDate && project.endDate
                        ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
                        : 'Sin fechas definidas'
                      }
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

      {/* Delete Project Dialog */}
      {projectToDelete && (
        <DeleteProjectDialog
          project={projectToDelete}
          open={!!projectToDelete}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
