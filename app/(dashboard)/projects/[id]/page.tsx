"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  Plus,
  MoreVertical,
  UserPlus,
  Settings,
  Edit,
  LayoutGrid,
  List,
  GanttChart,
  CalendarDays,
  Bot,
  UserCog,
  Clock,
  Trash2,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AddMemberDialog } from "@/components/projects/add-member-dialog"
import { EditProjectDialog } from "@/components/projects/edit-project-dialog"
import { ManagePermissionsDialog } from "@/components/projects/manage-permissions-dialog"
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog"
import { ProjectPermissionsSummary } from "@/components/projects/project-permissions-summary"
import { PermissionGuard, PermissionWrapper } from "@/components/projects/permission-guard"
import { ProjectChat } from "@/components/projects/project-chat"
import { ProjectBacklog } from "@/components/projects/project-backlog"
import { ProjectBoard } from "@/components/projects/project-board"
import { ProjectOKRs } from "@/components/projects/project-okrs"
import { ProjectHistoryDashboard } from "@/components/projects/project-history-dashboard"
import { ProjectSprints } from "@/components/projects/project-sprints"
import { ProjectMeetings } from "@/components/projects/project-meetings"
import { ProjectCalendar } from "@/components/projects/project-calendar"
import { ProjectTimeline } from "@/components/projects/project-timeline"
import { createApiUrl } from "@/lib/api-config"
import { enrichTasks } from "@/lib/data-helpers"
import { useProject } from "@/lib/domain/projects/hooks/use-project"
import { getProjectStatusLabel, getProjectStatusBadgeVariant } from "@/lib/domain/projects/utils/project-status.utils"
import type { Project as ProjectType } from "@/lib/domain/projects/types/project.types"
import { profileService } from "@/lib/domain/profile/services/profile.service"

interface Project {
  id: string
  name: string
  description: string
  objectives: string[]
  timeline: {
    start?: string
    end?: string
    startDate?: string
    estimatedEndDate?: string
  }
  members: string[]
  ownerId?: string
  createdBy: string
  createdAt: string
  status: string
  structuredPrompt?: {
    objective: string
    role: string
    context: string
    constraints: string
  }
}

type ProjectRole = 'scrum_master' | 'product_owner' | 'developer' | 'tester' | 'designer' | 'stakeholder'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
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

interface UserStory {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  storyPoints: number
  acceptanceCriteria: string[]
  status: string
  projectId: string
  createdBy: string
  createdAt: string
  aiGenerated?: boolean
}

interface Task {
  id: string
  title: string
  description: string
  userStoryId: string
  projectId: string
  assignedTo?: string
  status: string
  priority: string
  estimatedHours: number
  dueDate?: string
}

interface Sprint {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
  projectId: string
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const projectId = resolvedParams.id
  
  // Usar el hook DDD para obtener el proyecto
  const { project: dddProject, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(
    { projectId: projectId }
  )
  
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [memberPermissions, setMemberPermissions] = useState<Record<string, ProjectPermission>>({})
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState("summary")
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Sincronizar el proyecto del hook DDD con el estado local
  useEffect(() => {
    if (dddProject) {
      // Convertir el proyecto DDD al formato esperado por el componente
      setProject({
        id: dddProject.projectId,
        name: dddProject.name,
        description: dddProject.description,
        objectives: dddProject.objectives || [],
        timeline: {
          start: dddProject.startDate || undefined,
          end: dddProject.endDate || undefined,
          startDate: dddProject.startDate || undefined,
          estimatedEndDate: dddProject.endDate || undefined,
        },
        members: dddProject.members || [],
        ownerId: dddProject.ownerId,
        createdBy: dddProject.createdBy,
        createdAt: dddProject.createdAt,
        status: dddProject.status,
        structuredPrompt: dddProject.structuredPrompt ? JSON.parse(dddProject.structuredPrompt) : undefined,
      })
    }
  }, [dddProject])

  useEffect(() => {
    if (project) {
      fetchProjectDetails()
    }
  }, [project, resolvedParams.id])

  const fetchProjectDetails = async () => {
    if (!project) return
    
    try {
      setIsLoading(true)
      console.log('[ProjectDetail] Fetching project details, members:', project.members)

      // Fetch members from Profile-Service
      if (!project.members || project.members.length === 0) {
        console.log('[ProjectDetail] No members found in project')
        setMembers([])
        setIsLoading(false)
        return
      }

      const projectMembers: User[] = await Promise.all(
        project.members.map(async (memberId: string) => {
          console.log(`[ProjectDetail] Fetching profile for member: ${memberId}`)
          try {
            const profile = await profileService.getUserProfile({ userId: memberId })
            console.log(`[ProjectDetail] Profile fetched for ${memberId}:`, profile)
            return {
              id: profile.userId,
              name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userEmail,
              email: profile.userEmail,
              role: profile.userRole || 'developer',
              avatar: profile.userProfileImgUrl || '/placeholder.svg'
            }
          } catch (error) {
            // Si falla obtener el perfil, intentar obtener todos los usuarios y buscar
            console.warn(`[ProjectDetail] Could not fetch profile for user ${memberId}:`, error)
            try {
              // Intentar obtener todos los usuarios y buscar el que coincida
              const allUsers = await profileService.getAllUsers()
              const foundUser = allUsers.find(u => u.userId === memberId)
              if (foundUser) {
                console.log(`[ProjectDetail] Found user in allUsers list:`, foundUser)
                return {
                  id: foundUser.userId,
                  name: `${foundUser.userFirstName} ${foundUser.userLastName}`.trim() || foundUser.userEmail,
                  email: foundUser.userEmail,
                  role: foundUser.userRole || 'developer',
                  avatar: foundUser.userProfileImgUrl || '/placeholder.svg'
                }
              }
            } catch (fallbackError) {
              console.warn(`[ProjectDetail] Could not fetch all users as fallback:`, fallbackError)
            }
            // Último recurso: mostrar "Usuario" + primeros caracteres del ID
            console.warn(`[ProjectDetail] Using fallback name for ${memberId}`)
            return {
              id: memberId,
              name: `Usuario ${memberId.substring(0, 8)}...`,
              email: `${memberId}@example.com`,
              role: 'developer',
              avatar: '/placeholder.svg'
            }
          }
        })
      )
      console.log('[ProjectDetail] Final members array:', projectMembers)
      setMembers(projectMembers)
      
      // Verificar que los miembros se hayan cargado correctamente
      if (projectMembers.length > 0) {
        console.log('[ProjectDetail] Members loaded successfully:', projectMembers.map(m => ({ id: m.id, name: m.name })))
      }

      // Fetch permissions for all members - TODO: Usar permission service DDD
      // Por ahora, dejamos vacío
      setMemberPermissions({})

      // Fetch user stories usando servicio DDD
      let loadedUserStories: UserStory[] = []
      try {
        const { userStoryService } = await import('@/lib/domain/user-stories/services/user-story.service')
        const userStoriesData = await userStoryService.getUserStoriesByProjectId(projectId)
        loadedUserStories = Array.isArray(userStoriesData) ? userStoriesData : []
        setUserStories(loadedUserStories)
      } catch (err) {
        console.warn("Error loading user stories:", err)
        setUserStories([])
      }

      // Fetch tasks using DDD service - get tasks from all user stories in the project
      let loadedTasks: Task[] = []
      try {
        const { taskService } = await import('@/lib/domain/tasks/services/task.service')
        
        // Helper functions to map backend format to component format
        const mapPriority = (priority: string): "high" | "medium" | "low" => {
          const upperPriority = priority.toUpperCase()
          if (upperPriority === "ALTA") return "high"
          if (upperPriority === "MEDIA") return "medium"
          if (upperPriority === "BAJA") return "low"
          return "medium" // default
        }

        const mapStatus = (status: string): "todo" | "in_progress" | "done" => {
          const upperStatus = status.toUpperCase()
          if (upperStatus === "TODO") return "todo"
          if (upperStatus === "IN_PROGRESS") return "in_progress"
          if (upperStatus === "DONE") return "done"
          return "todo" // default
        }

        // Get tasks for each user story in the project
        const tasksPromises = loadedUserStories.map(async (userStory) => {
          try {
            const storyTasks = await taskService.getTasksByUserStoryId(userStory.id)
            // Map backend task format to component format and add projectId
            return storyTasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              status: mapStatus(task.status),
              priority: mapPriority(task.priority),
              assignedTo: task.assignedTo || undefined,
              estimatedHours: task.estimatedHours,
              projectId: project.id, // Add projectId from current project
              userStoryId: task.userStoryId,
              aiAssigned: task.aiGenerated,
              createdAt: task.createdAt ? (typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString()) : new Date().toISOString(),
            }))
          } catch (error) {
            console.warn(`Error loading tasks for user story ${userStory.id}:`, error)
            return []
          }
        })
        
        const tasksArrays = await Promise.all(tasksPromises)
        loadedTasks = tasksArrays.flat()
        setTasks(loadedTasks)
        console.log(`[ProjectDetail] Loaded ${loadedTasks.length} tasks from ${loadedUserStories.length} user stories`)
      } catch (err) {
        console.warn("Error loading tasks:", err)
        setTasks([])
      }

      // Fetch sprints usando ApiClient con autenticación
      let loadedSprints: Sprint[] = []
      try {
        const { getApiClient } = await import('@/lib/infrastructure/api/api-client')
        const apiClient = getApiClient()
        const sprintsData = await apiClient.get<Sprint[]>(`/api/v1/sprints/project/${project.id}`)
        loadedSprints = Array.isArray(sprintsData) ? sprintsData : []
        setSprints(loadedSprints)
        console.log('[ProjectDetail] Sprints cargados:', loadedSprints.length, loadedSprints)
      } catch (err) {
        console.warn("Error loading sprints:", err)
        setSprints([])
      }
      
      console.log("🎯 Contexto completo cargado:")
      console.log("  - User Stories:", loadedUserStories.length)
      console.log("  - Tasks:", loadedTasks.length)
      console.log("  - Sprints:", loadedSprints.length)
      console.log("  - Members:", projectMembers.length)
    } catch (error) {
      console.error("[v0] Error fetching project details:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar los detalles del proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSuccess = () => {
    // Redirect to projects page after successful deletion
    router.push('/projects')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRoleBadge = (role: ProjectRole) => {
    const roleMap: Record<ProjectRole, { label: string; color: string }> = {
      scrum_master: { label: "Scrum Master", color: "bg-chart-1 text-white" },
      product_owner: { label: "Product Owner", color: "bg-chart-2 text-white" },
      developer: { label: "Developer", color: "bg-chart-3 text-white" },
      tester: { label: "Tester", color: "bg-chart-4 text-white" },
      designer: { label: "Designer", color: "bg-chart-5 text-white" },
      stakeholder: { label: "Stakeholder", color: "bg-blue-100 text-blue-800" },
    }
    return roleMap[role] || { label: role, color: "bg-muted" }
  }

  const checkIsAdmin = (): boolean => {
    // En un sistema real, aquí se verificaría el rol del usuario en el proyecto
    // Por ahora, asumimos que el creador del proyecto es admin
    return project?.createdBy === user?.id
  }

  if (projectLoading || isLoading) {
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

  if (projectError || (!project && !projectLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold">Proyecto no encontrado</h2>
        <p className="mt-2 text-muted-foreground">{projectError || "El proyecto solicitado no existe"}</p>
        <Link href="/projects">
          <Button className="mt-4">Volver a Proyectos</Button>
        </Link>
      </div>
    )
  }

  if (!project) {
    return null // Aún cargando
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <Badge variant={getProjectStatusBadgeVariant(project.status)}>
                {getProjectStatusLabel(project.status)}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Editar Proyecto - Visible si el usuario es owner o tiene permisos */}
            {(user?.id === project.createdBy || user?.id === project.ownerId) ? (
              <DropdownMenuItem onClick={() => setIsEditProjectDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Proyecto
              </DropdownMenuItem>
            ) : (
              <PermissionWrapper
                projectId={project.id}
                userId={user?.id || ""}
                requiredPermission="manage_project"
              >
                {(canManageProject) => (
                  canManageProject && (
                    <DropdownMenuItem onClick={() => setIsEditProjectDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Proyecto
                    </DropdownMenuItem>
                  )
                )}
              </PermissionWrapper>
            )}
            <PermissionWrapper
              projectId={project.id}
              userId={user?.id || ""}
              requiredPermission="manage_members"
            >
              {(canManageMembers) => (
                canManageMembers && (
                  <DropdownMenuItem onClick={() => setIsAddMemberDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Miembro
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
                  <DropdownMenuItem onClick={() => setIsPermissionsDialogOpen(true)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Gestionar Permisos
                  </DropdownMenuItem>
                )
              )}
            </PermissionWrapper>
            {/* Eliminar Proyecto - Visible si el usuario es owner o tiene permisos */}
            {(user?.id === project.createdBy || user?.id === project.ownerId) ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Proyecto
                </DropdownMenuItem>
              </>
            ) : (
              <PermissionWrapper
                projectId={project.id}
                userId={user?.id || ""}
                requiredPermission="manage_project"
              >
                {(canManageProject) => (
                  canManageProject && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Proyecto
                      </DropdownMenuItem>
                    </>
                  )
                )}
              </PermissionWrapper>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
              <p className="font-medium">
                {formatDate(project.timeline.startDate || project.timeline.start || "")}
              </p>
              <p className="text-muted-foreground">
                hasta {formatDate(project.timeline.estimatedEndDate || project.timeline.end || "")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">miembros activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.objectives.length}</div>
            <p className="text-xs text-muted-foreground">objetivos definidos</p>
          </CardContent>
        </Card>

        {/* Permisos del Usuario */}
        <ProjectPermissionsSummary
          projectId={project.id}
          userId={user?.id || ""}
        />
      </div>

      {/* Views Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          {/* Vista General */}
          <TabsTrigger value="summary">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Resumen
          </TabsTrigger>
          {/* Planificación y Ejecución */}
          <TabsTrigger value="backlog">
            <List className="mr-2 h-4 w-4" />
            Backlog
          </TabsTrigger>
          <TabsTrigger value="board">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="sprints">
            <CalendarDays className="mr-2 h-4 w-4" />
            Sprints
          </TabsTrigger>
          {/* Objetivos y Planificación Temporal */}
          <TabsTrigger value="okrs">
            <Target className="mr-2 h-4 w-4" />
            OKRs
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChart className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          {/* Calendario y Colaboración */}
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Video className="mr-2 h-4 w-4" />
            Reuniones
          </TabsTrigger>
          {/* Asistente e Historial */}
          <TabsTrigger value="chat">
            <Bot className="mr-2 h-4 w-4" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Objetivos del Proyecto</CardTitle>
                <CardDescription>Metas y objetivos SMART</CardDescription>
              </CardHeader>
              <CardContent>
                {project.objectives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay objetivos definidos</p>
                ) : (
                  <ul className="space-y-2">
                    {project.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Target className="mt-0.5 h-4 w-4 text-chart-1" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Miembros del Equipo</CardTitle>
                    <CardDescription>Colaboradores del proyecto</CardDescription>
                  </div>
                  <PermissionGuard
                    projectId={project.id}
                    userId={user?.id || ""}
                    requiredPermission="manage_members"
                  >
                    <Button size="sm" variant="outline" onClick={() => setIsAddMemberDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading && members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Cargando miembros...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay miembros en el proyecto</p>
                  ) : (
                    members.map((member) => {
                      const memberPerm = memberPermissions[member.id]
                      const roleBadge = memberPerm ? getRoleBadge(memberPerm.role) : null
                      return (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                              <AvatarFallback className="bg-chart-1 text-white">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              {roleBadge && (
                                <Badge className={`mt-1 text-xs ${roleBadge.color}`}>{roleBadge.label}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backlog" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectBacklog 
              projectId={dddProject?.projectId || project.id || projectId} 
              projectName={project.name} 
              externalUserStories={userStories}
              onTaskCreated={() => {
                // Recargar las tareas cuando se crea una nueva
                fetchProjectDetails()
              }}
              onStoryCreated={() => {
                // Recargar las user stories cuando se crea una nueva
                fetchProjectDetails()
              }}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="sprints" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectSprints 
              projectId={dddProject?.projectId || project.id || projectId} 
              projectName={project.name} 
              externalUserStories={userStories}
              onSprintUpdated={() => {
                // Recargar los datos cuando se actualiza un sprint
                fetchProjectDetails()
              }}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <div className="h-[600px]">
              <ProjectChat
                projectId={project.id}
                projectContext={{
                  projectName: project.name,
                  description: project.description,
                  objectives: project.objectives,
                  timeline: project.timeline,
                  productBacklog: userStories,
                  tasks: tasks,
                  sprints: sprints,
                  teamMembers: members,
                }}
                initialPrompt={project.structuredPrompt}
                onDataUpdate={() => {
                  refetchProject()
                  fetchProjectDetails()
                }} // Actualiza sin reload
              />
            </div>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="board">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectBoard 
              projectId={project.id}
              tasks={tasks}
              members={members}
              userStories={userStories}
              sprints={sprints}
              onUpdate={() => {
                refetchProject()
                fetchProjectDetails()
              }}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="okrs">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectOKRs 
              projectId={project.id}
              projectName={project.name}
              members={members}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <List className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vista de Lista</h3>
              <p className="text-sm text-muted-foreground">Próximamente: Lista detallada de tareas</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectTimeline 
              projectId={dddProject?.projectId || project.id || projectId} 
              projectName={project.name}
              projectStartDate={dddProject?.startDate || project.timeline?.start || project.timeline?.startDate}
              projectEndDate={dddProject?.endDate || project.timeline?.end || project.timeline?.estimatedEndDate}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ProjectHistoryDashboard projectId={project.id} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectCalendar 
              projectId={dddProject?.projectId || project.id || projectId} 
              projectName={project.name}
              projectEndDate={dddProject?.endDate || project.timeline?.end || project.timeline?.estimatedEndDate}
            />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <PermissionGuard
            projectId={project.id}
            userId={user?.id || ""}
            requiredPermission="read"
            showError={true}
          >
            <ProjectMeetings 
              projectId={dddProject?.projectId || project.id || projectId} 
              projectName={project.name}
              onMeetingUpdated={() => {
                // Recargar los datos cuando se actualiza una reunión
                fetchProjectDetails()
              }}
            />
          </PermissionGuard>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <PermissionGuard
        projectId={project.id}
        userId={user?.id || ""}
        requiredPermission="manage_members"
      >
        <AddMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          projectId={project.id}
          currentMembers={project.members}
          currentUserId={user?.id || ""}
          onMemberAdded={() => {
            refetchProject()
            fetchProjectDetails()
          }}
        />
      </PermissionGuard>

      {/* Edit Project Dialog - Visible si el usuario es owner o tiene permisos */}
      {(user?.id === project?.createdBy || user?.id === project?.ownerId) ? (
        <EditProjectDialog
          open={isEditProjectDialogOpen}
          onOpenChange={setIsEditProjectDialogOpen}
          project={project}
          onProjectUpdated={() => {
            refetchProject()
            fetchProjectDetails()
          }}
        />
      ) : (
        <PermissionGuard
          projectId={project.id}
          userId={user?.id || ""}
          requiredPermission="manage_project"
        >
          <EditProjectDialog
            open={isEditProjectDialogOpen}
            onOpenChange={setIsEditProjectDialogOpen}
            project={project}
            onProjectUpdated={() => {
              refetchProject()
              fetchProjectDetails()
            }}
          />
        </PermissionGuard>
      )}

      {/* Manage Permissions Dialog */}
      <PermissionGuard
        projectId={project.id}
        userId={user?.id || ""}
        requiredPermission="manage_permissions"
      >
        <ManagePermissionsDialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          projectId={project.id}
          currentUser={user!}
          isAdmin={checkIsAdmin()}
          onPermissionsUpdated={() => {
            refetchProject()
            fetchProjectDetails()
          }}
        />
      </PermissionGuard>

      {/* Delete Project Dialog - Visible si el usuario es owner o tiene permisos */}
      {(user?.id === project?.createdBy || user?.id === project?.ownerId) ? (
        <DeleteProjectDialog
          project={{
            id: project.id,
            name: project.name,
          }}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      ) : (
        <PermissionGuard
          projectId={project.id}
          userId={user?.id || ""}
          requiredPermission="manage_project"
        >
          <DeleteProjectDialog
            project={{
              id: project.id,
              name: project.name,
            }}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={handleDeleteSuccess}
          />
        </PermissionGuard>
      )}
    </div>
  )
}
