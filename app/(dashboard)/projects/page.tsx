"use client"

import { useState, useEffect, useCallback } from "react"
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
import { EditProjectDialog } from "@/components/projects/edit-project-dialog"
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog"
import { useProjects } from "@/lib/domain/projects/hooks/use-projects"
import { permissionService } from "@/lib/domain/projects/services/permission.service"
import type { Project, ProjectPermission, ProjectRole } from "@/lib/domain/projects/types/project.types"

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { projects, isLoading, error, refetch } = useProjects()
  const [projectPermissions, setProjectPermissions] = useState<Record<string, ProjectPermission>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  // Cargar permisos cuando cambien los proyectos
  const loadPermissions = useCallback(async () => {
    if (!user || !projects.length) return

    try {
      const permissionsMap: Record<string, ProjectPermission> = {}
      
      for (const project of projects) {
        try {
          const perms = await permissionService.getPermissionsByProjectId(project.projectId)
          if (perms && perms.length > 0) {
            const userPerm = perms.find(p => p.userId === user.id)
            if (userPerm) {
              permissionsMap[project.projectId] = userPerm
            }
          }
        } catch (err) {
          // Ignorar errores de permisos individuales
          console.warn(`No se pudieron cargar permisos para proyecto ${project.projectId}`)
        }
      }
      
      setProjectPermissions(permissionsMap)
    } catch (error) {
      console.error("Error loading permissions:", error)
    }
  }, [projects, user])

  // Cargar permisos cuando cambien los proyectos o el usuario
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const handleDeleteSuccess = () => {
    refetch()
  }

  const getRoleLabel = (role: ProjectRole) => {
    const roleLabels: Record<ProjectRole, string> = {
      scrum_master: 'Scrum Master',
      product_owner: 'Product Owner',
      developer: 'Developer',
      tester: 'Tester',
      designer: 'Designer',
      stakeholder: 'Stakeholder',
      contributor: 'Contributor'
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
      stakeholder: 'bg-blue-100 text-blue-800',
      contributor: 'bg-gray-100 text-gray-800'
    }
    return roleColors[role] || 'bg-gray-100 text-gray-800'
  }

  const filteredProjects = projects
    .filter((project) => {
      // Filtrar solo proyectos donde el usuario es miembro
      if (!user) return false
      // Asegurar que members sea un array y contenga el userId
      if (!project.members || !Array.isArray(project.members)) return false
      return project.members.includes(user.id) || project.ownerId === user.id
    })
    .filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (error) {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    })
  }

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
            <Card key={project.projectId} className="group relative overflow-hidden transition-all hover:shadow-lg">
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
                      <DropdownMenuItem 
                        onClick={() => {
                          setProjectToEdit(project)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setProjectToDelete({ id: project.projectId, name: project.name })} 
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
                  {projectPermissions[project.projectId] && (
                    <Badge className={getRoleBadgeColor(projectPermissions[project.projectId].role)}>
                      {getRoleLabel(projectPermissions[project.projectId].role)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {project.startDate && project.endDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.members.length} miembros</span>
                  </div>
                </div>

                <Link href={`/projects/${project.projectId}`}>
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
        onProjectCreated={refetch}
      />

      {/* Edit Project Dialog */}
      {projectToEdit && (
        <EditProjectDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setProjectToEdit(null)
            }
          }}
          project={{
            id: projectToEdit.projectId,
            name: projectToEdit.name,
            description: projectToEdit.description,
            objectives: projectToEdit.objectives || [],
            timeline: {
              start: projectToEdit.startDate || undefined,
              end: projectToEdit.endDate || undefined,
              startDate: projectToEdit.startDate || undefined,
              estimatedEndDate: projectToEdit.endDate || undefined,
            },
            members: projectToEdit.members || [],
            createdBy: projectToEdit.createdBy,
            createdAt: projectToEdit.createdAt,
            status: projectToEdit.status,
          }}
          onProjectUpdated={() => {
            refetch()
            setIsEditDialogOpen(false)
            setProjectToEdit(null)
          }}
        />
      )}

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
