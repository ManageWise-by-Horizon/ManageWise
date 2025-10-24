"use client"

import { useState, useEffect, use } from "react"
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
  LayoutGrid,
  List,
  GanttChart,
  CalendarDays,
  Bot,
  UserCog,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddMemberDialog } from "@/components/projects/add-member-dialog"
import { EditProjectDialog } from "@/components/projects/edit-project-dialog"
import { ManagePermissionsDialog } from "@/components/projects/manage-permissions-dialog"
import { ProjectPermissionsSummary } from "@/components/projects/project-permissions-summary"
import { PermissionGuard, PermissionWrapper } from "@/components/projects/permission-guard"
import { ProjectChat } from "@/components/projects/project-chat"
import { ProjectBacklog } from "@/components/projects/project-backlog"
import { ProjectBoard } from "@/components/projects/project-board"
import { ProjectOKRs } from "@/components/projects/project-okrs"

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

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
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
  name: string
  goal: string
  startDate: string
  endDate: string
  status: string
  projectId: string
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState("summary")
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)

  useEffect(() => {
    fetchProjectDetails()
  }, [resolvedParams.id])

  const fetchProjectDetails = async () => {
    try {
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${resolvedParams.id}`)
      const projectData = await projectRes.json()
      setProject(projectData)

      // Fetch members
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const usersData = await usersRes.json()
      const projectMembers = usersData.filter((u: User) => projectData.members.includes(u.id))
      setMembers(projectMembers)

      // Fetch user stories
      const userStoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories?projectId=${resolvedParams.id}`)
      const userStoriesData = await userStoriesRes.json()
      setUserStories(userStoriesData)

      // Fetch tasks for this project
      const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks?projectId=${resolvedParams.id}`)
      const tasksData = await tasksRes.json()
      setTasks(tasksData)

      // Fetch sprints for this project
      const sprintsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sprints?projectId=${resolvedParams.id}`)
      const sprintsData = await sprintsRes.json()
      setSprints(sprintsData)
      
      console.log("🎯 Contexto completo cargado:")
      console.log("  - User Stories:", userStoriesData.length)
      console.log("  - Tasks:", tasksData.length)
      console.log("  - Sprints:", sprintsData.length)
      console.log("  - Members:", projectMembers.length)
    } catch (error) {
      console.error("[v0] Error fetching project details:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      scrum_master: { label: "Scrum Master", color: "bg-chart-1" },
      product_owner: { label: "Product Owner", color: "bg-chart-2" },
      developer: { label: "Developer", color: "bg-chart-3" },
    }
    return roleMap[role] || { label: role, color: "bg-muted" }
  }

  const checkIsAdmin = (): boolean => {
    // En un sistema real, aquí se verificaría el rol del usuario en el proyecto
    // Por ahora, asumimos que el creador del proyecto es admin
    return project?.createdBy === user?.id
  }

  if (isLoading) {
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold">Proyecto no encontrado</h2>
        <Link href="/projects">
          <Button className="mt-4">Volver a Proyectos</Button>
        </Link>
      </div>
    )
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
              <Badge variant={project.status === "active" ? "default" : "secondary"}>
                {project.status === "active" ? "Activo" : "Inactivo"}
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
            <PermissionWrapper
              projectId={project.id}
              userId={user?.id || ""}
              requiredPermission="manage_project"
            >
              {(canManageProject) => (
                canManageProject && (
                  <DropdownMenuItem onClick={() => setIsEditProjectDialogOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                )
              )}
            </PermissionWrapper>
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
          <TabsTrigger value="summary">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="backlog">
            <List className="mr-2 h-4 w-4" />
            Backlog
          </TabsTrigger>
          <TabsTrigger value="chat">
            <Bot className="mr-2 h-4 w-4" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="board">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="okrs">
            <Target className="mr-2 h-4 w-4" />
            OKRs
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChart className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendario
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
                  {members.map((member) => {
                    const roleBadge = getRoleBadge(member.role)
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
                            <Badge className={`mt-1 text-xs ${roleBadge.color}`}>{roleBadge.label}</Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
              projectId={project.id} 
              projectName={project.name} 
              externalUserStories={userStories}
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
                onDataUpdate={fetchProjectDetails} // Actualiza sin reload
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
              onUpdate={fetchProjectDetails}
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

        <TabsContent value="timeline">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GanttChart className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vista de Timeline</h3>
              <p className="text-sm text-muted-foreground">Próximamente: Diagrama de Gantt interactivo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Vista de Calendario</h3>
              <p className="text-sm text-muted-foreground">Próximamente: Calendario con eventos y reuniones</p>
            </CardContent>
          </Card>
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
          onMemberAdded={fetchProjectDetails}
        />
      </PermissionGuard>

      {/* Edit Project Dialog */}
      <PermissionGuard
        projectId={project.id}
        userId={user?.id || ""}
        requiredPermission="manage_project"
      >
        <EditProjectDialog
          open={isEditProjectDialogOpen}
          onOpenChange={setIsEditProjectDialogOpen}
          project={project}
          onProjectUpdated={fetchProjectDetails}
        />
      </PermissionGuard>

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
          onPermissionsUpdated={fetchProjectDetails}
        />
      </PermissionGuard>
    </div>
  )
}
