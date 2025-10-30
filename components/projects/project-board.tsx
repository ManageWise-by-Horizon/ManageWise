"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Sparkles, GripVertical } from "lucide-react"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { useProjectHistory } from "@/hooks/use-project-history"
import { TaskDetailModal } from "./task-detail-modal"
import { createApiUrl } from "@/lib/api-config"
import { getPriorityColor } from "@/lib/ui-helpers"

interface ProjectTask {
  id: string
  title: string
  description: string
  status: string
  assignedTo?: string
  priority: string
  estimatedHours: number
  projectId: string
  userStoryId?: string
  aiAssigned?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

interface ProjectBoardProps {
  projectId: string
  tasks: ProjectTask[]
  members: User[]
  onUpdate: () => void
}

export function ProjectBoard({ projectId, tasks, members, onUpdate }: ProjectBoardProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { logChange } = useProjectHistory()
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Drag-and-drop setup
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = []

    const draggables = document.querySelectorAll('[data-draggable-task]')
    draggables.forEach((el) => {
      const cleanup = draggable({
        element: el as HTMLElement,
        getInitialData: () => ({ taskId: el.getAttribute('data-task-id') }),
      })
      cleanupFunctions.push(cleanup)
    })

    const dropColumns = document.querySelectorAll('[data-drop-column]')
    dropColumns.forEach((el) => {
      const cleanup = dropTargetForElements({
        element: el as HTMLElement,
        onDragEnter: ({ source }) => {
          setDragOverColumn(el.getAttribute('data-column-id'))
        },
        onDragLeave: () => {
          setDragOverColumn(null)
        },
        onDrop: ({ source }) => {
          const taskId = String(source.data.taskId || '')
          const newStatus = String(el.getAttribute('data-column-id') || '')
          if (taskId && newStatus) {
            updateTaskStatus(taskId, newStatus)
          }
          setDragOverColumn(null)
        },
      })
      cleanupFunctions.push(cleanup)
    })

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
      setDragOverColumn(null)
    }
  }, [tasks])

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Obtener datos actuales de la tarea
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const oldStatus = task.status

      const response = await fetch(createApiUrl(`/tasks/${taskId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        // Registrar el cambio en el historial
        if (user) {
          const statusLabels: Record<string, string> = {
            todo: "Por Hacer",
            in_progress: "En Progreso",
            done: "Completado"
          }

          await logChange(
            'task_status_changed',
            'task',
            taskId,
            `Estado de tarea cambiado: ${task.title}`,
            {
              title: task.title,
              oldValue: statusLabels[oldStatus] || oldStatus,
              newValue: statusLabels[newStatus] || newStatus
            },
            {
              projectId,
              userId: user.id,
              userAgent: 'ManageWise Web App',
              source: 'manual'
            }
          )
        }

        toast({
          title: "Tarea actualizada",
          description: "El estado de la tarea se ha actualizado correctamente",
        })
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      })
    }
  }

  const normalizeStatus = (status: string): "todo" | "in_progress" | "done" => {
    if (status === "pending" || status === "to_do" || status === "todo") return "todo"
    if (status === "in_progress" || status === "in-progress" || status === "active") return "in_progress"  
    if (status === "done" || status === "completed" || status === "finished") return "done"
    return "todo"
  }

  const getUser = (userId: string) => {
    return members.find((u) => u.id === userId)
  }

  const columns = [
    { id: "todo", title: "Por Hacer", status: "todo" },
    { id: "in_progress", title: "En Progreso", status: "in_progress" },
    { id: "done", title: "Completado", status: "done" },
  ]

  const getTasksByNormalizedStatus = (normalizedStatus: string) => {
    return tasks.filter((t) => normalizeStatus(t.status) === normalizedStatus)
  }

  const handleTaskClick = (task: ProjectTask, event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest('[data-drag-handle]')) {
      return
    }
    
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Board del Proyecto</h2>
          <p className="text-muted-foreground">Gestiona las tareas con drag & drop</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tasks.length} tareas totales</Badge>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-3 h-[500px]">
        {columns.map((column) => {
          const columnTasks = getTasksByNormalizedStatus(column.status)
          const isActiveDrop = dragOverColumn === column.id
          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col transition-all rounded-lg p-4 border",
                "h-full",
                isActiveDrop ? "ring-2 ring-primary/60 bg-primary/5" : "bg-muted/20"
              )}
              data-drop-column
              data-column-id={column.id}
            >
              {/* Column Header - Fixed */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>

              {/* Scrollable Content */}
              <div 
                className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0 kanban-scroll"
                style={{
                  maxHeight: '400px', // Altura fija para mostrar ~3.5 tareas
                }}
              >
                {columnTasks.length === 0 ? (
                  <Card className="border-dashed border-2 flex-shrink-0">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {column.id === "todo" ? "Arrastra tareas aquí" : "No hay tareas"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  columnTasks.map((task) => {
                    const assignedUser = getUser(task.assignedTo || "")
                    return (
                      <Card
                        key={task.id}
                        className="group cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary/20 flex-shrink-0"
                        data-draggable-task
                        data-task-id={task.id}
                        onClick={(e) => handleTaskClick(task, e)}
                      >
                        <CardContent className="p-2">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium leading-tight flex items-center gap-1 flex-1">
                              <GripVertical 
                                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" 
                                data-drag-handle
                              />
                              <span className="line-clamp-2">{task.title}</span>
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                              {task.aiAssigned && (
                                <Badge variant="secondary" className="gap-1 text-xs px-1 py-0 h-4">
                                  <Sparkles className="h-2 w-2" />
                                </Badge>
                              )}
                              <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              {assignedUser ? (
                                <>
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={assignedUser.avatar || "/placeholder.svg"} alt={assignedUser.name} />
                                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                      {assignedUser.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-muted-foreground truncate max-w-[60px]">{assignedUser.name}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Sin asignar</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {task.estimatedHours}h
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask}
        members={members}
        onUpdate={onUpdate}
      />

      {/* Empty State for no tasks */}
      {tasks.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GripVertical className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay tareas en este proyecto</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Las tareas aparecerán aquí una vez que se creen desde los sprints o user stories
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}