"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Sparkles, GripVertical } from "lucide-react"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { cn } from "@/lib/utils"
import { TaskDetailModal } from "@/components/projects/task-detail-modal"
import { useAuth } from "@/lib/auth/auth-context"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "done"
  assignedTo: string
  priority: string
  estimatedHours: number
  aiAssigned?: boolean
}

interface TaskBoardProps {
  tasks: Task[]
  onUpdate: () => void
  projectId?: string
}

type DragState = "idle" | "preview" | "dragging"

export function TaskBoard({ tasks, onUpdate, projectId }: TaskBoardProps) {
  const { user } = useAuth()
  const { hasPermission, userRole } = useProjectPermissions(projectId || '', user?.id || '')
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Drag-and-drop setup
  useEffect(() => {
    const draggables = document.querySelectorAll('[data-draggable-task]')
    draggables.forEach((el) => {
      draggable({
        element: el as HTMLElement,
        getInitialData: () => ({ taskId: el.getAttribute('data-task-id') }),
      })
    })

    const dropColumns = document.querySelectorAll('[data-drop-column]')
    dropColumns.forEach((el) => {
      dropTargetForElements({
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
    })
    return () => {
      setDragOverColumn(null)
    }
  }, [tasks])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Check permissions before updating status (only if projectId is provided)
    if (projectId && !hasPermission("write")) {
      toast({
        title: "Sin permisos",
        description: `Tu rol ${userRole} no permite cambiar el estado de las tareas`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => t.status === status)
  }

  const getUser = (userId: string) => {
    return users.find((u) => u.id === userId)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-chart-5",
      medium: "bg-chart-4",
      low: "bg-chart-2",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const columns = [
    { id: "todo", title: "Por Hacer", status: "todo" },
    { id: "in_progress", title: "En Progreso", status: "in_progress" },
    { id: "done", title: "Completado", status: "done" },
  ]

  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    // Prevent opening modal when clicking on drag handle
    const target = event.target as HTMLElement
    if (target.closest('[data-drag-handle]')) {
      return
    }
    
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 h-[500px]">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status)
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
              <h3 className="font-semibold">{column.title}</h3>
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
                <Card className="border-dashed flex-shrink-0">
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">No hay tareas</p>
                  </CardContent>
                </Card>
              ) : (
                columnTasks.map((task) => {
                  const assignedUser = getUser(task.assignedTo)
                  return (
                    <Card
                      key={task.id}
                      className="group cursor-pointer transition-all hover:shadow-lg flex-shrink-0"
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
                          {task.aiAssigned && (
                            <Badge variant="secondary" className="gap-1 text-xs px-1 py-0 h-4 ml-1 flex-shrink-0">
                              <Sparkles className="h-2 w-2" />
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            {assignedUser && (
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={assignedUser.avatar || "/placeholder.svg"} alt={assignedUser.name} />
                                <AvatarFallback className="text-xs">
                                  {assignedUser.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-muted-foreground truncate max-w-[60px]">{assignedUser?.name}</span>
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask}
        members={users}
        onUpdate={onUpdate}
      />
    </div>
  )
}
