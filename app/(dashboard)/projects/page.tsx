"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { cascadeDeleteProject } from "@/lib/cascade-delete"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, FolderKanban, Users, Calendar, MoreVertical, Trash2, Edit, Clock, Filter, X, UserCog } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ManagePermissionsDialog } from "@/components/projects/manage-permissions-dialog"
import { PermissionWrapper } from "@/components/projects/permission-guard"

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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedProjectForPermissions, setSelectedProjectForPermissions] = useState<string>("")

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

  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project)
    setDeleteConfirmationText("") // Limpiar el texto cuando se abre para un nuevo proyecto
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setProjectToDelete(null)
    setDeleteConfirmationText("")
    setIsDeleteDialogOpen(false)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      // Mostrar toast de progreso
      toast({
        title: "Eliminando proyecto",
        description: "Eliminando proyecto y todas las entidades relacionadas...",
      })

      // Usar la función de eliminación en cascada
      const result = await cascadeDeleteProject({
        projectId: projectToDelete.id,
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
        setProjects(projects.filter((p) => p.id !== projectToDelete.id))

        // Mostrar resumen de eliminación
        const totalDeleted = Object.values(result.deletedEntities).reduce((sum, count) => sum + count, 0);
        
        toast({
          title: "Proyecto eliminado exitosamente",
          description: `Proyecto "${projectToDelete.name}" y ${totalDeleted} entidades relacionadas eliminadas`,
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
        setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      }

    } catch (error) {
      console.error("[v0] Error deleting project:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto completamente",
        variant: "destructive",
      })
    } finally {
      closeDeleteDialog()
    }
  }

  const handleDeleteProject = (project: Project) => {
    openDeleteDialog(project)
  }

  const handleManagePermissions = (projectId: string) => {
    setSelectedProjectForPermissions(projectId)
    setIsPermissionsDialogOpen(true)
  }

  const checkIsAdmin = (project: Project): boolean => {
    // En un sistema real, aquí se verificaría el rol del usuario en el proyecto
    // Por ahora, asumimos que el creador del proyecto es admin
    return project.createdBy === user?.id
  }

  const filteredProjects = projects.filter((project) => {
    // Filtro por nombre
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtro por estado
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    
    // Filtro por fecha de creación
    let matchesDate = true
    if (dateFilter !== "all") {
      const projectDate = new Date(project.createdAt)
      const today = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = projectDate.toDateString() === today.toDateString()
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = projectDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = projectDate >= monthAgo
          break
        case "older":
          const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          matchesDate = projectDate < threeMonthsAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="older">Más de 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(searchQuery || statusFilter !== "all" || dateFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Estado: {statusFilter === "active" ? "Activo" : "Inactivo"}
              <button
                onClick={() => setStatusFilter("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Fecha: {
                dateFilter === "today" ? "Hoy" :
                dateFilter === "week" ? "Última semana" :
                dateFilter === "month" ? "Último mes" :
                "Más de 3 meses"
              }
              <button
                onClick={() => setDateFilter("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
              setDateFilter("all")
            }}
            className="h-6 px-2 text-xs"
          >
            Limpiar filtros
          </Button>
        </div>
      )}

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
              {searchQuery || statusFilter !== "all" || dateFilter !== "all" 
                ? "No se encontraron proyectos" 
                : "No tienes proyectos aún"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda" 
                : "Crea tu primer proyecto para comenzar"}
            </p>
            {!searchQuery && statusFilter === "all" && dateFilter === "all" && (
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
                      <PermissionWrapper
                        projectId={project.id}
                        userId={user?.id || ""}
                        requiredPermission="manage_project"
                      >
                        {(canManageProject) => (
                          canManageProject && (
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )
                        )}
                      </PermissionWrapper>
                      <PermissionWrapper
                        projectId={project.id}
                        userId={user?.id || ""}
                        requiredPermission="manage_permissions"
                      >
                        {(canManagePermissions) => (
                          canManagePermissions && (
                            <DropdownMenuItem onClick={() => handleManagePermissions(project.id)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Gestionar Permisos
                            </DropdownMenuItem>
                          )
                        )}
                      </PermissionWrapper>
                      <PermissionWrapper
                        projectId={project.id}
                        userId={user?.id || ""}
                        requiredPermission="manage_project"
                      >
                        {(canManageProject) => (
                          canManageProject && (
                            <DropdownMenuItem onClick={() => handleDeleteProject(project)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )
                        )}
                      </PermissionWrapper>
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
                    <Clock className="h-4 w-4" />
                    <span>Creado: {formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Timeline: {formatDate(project.timeline.start)} - {formatDate(project.timeline.end)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el proyecto "{projectToDelete?.name}" y todos sus datos relacionados (User Stories, tareas, sprints, etc.). 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Para confirmar, escribe <strong>{projectToDelete?.name}</strong> en el campo de abajo:
            </p>
            <Input
              placeholder={`Escribe "${projectToDelete?.name}" para confirmar`}
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              disabled={deleteConfirmationText !== projectToDelete?.name}
              className={`${
                deleteConfirmationText !== projectToDelete?.name
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                  : "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              }`}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={fetchProjects}
      />

      {/* Manage Permissions Dialog */}
      <ManagePermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        projectId={selectedProjectForPermissions}
        currentUser={user!}
        isAdmin={checkIsAdmin(projects.find(p => p.id === selectedProjectForPermissions) || {} as Project)}
        onPermissionsUpdated={fetchProjects}
      />
    </div>
  )
}
