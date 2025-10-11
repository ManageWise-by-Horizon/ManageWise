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
}

type DragState = "idle" | "preview" | "dragging"

export function TaskBoard({ tasks, onUpdate }: TaskBoardProps) {
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
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status)
        const isActiveDrop = dragOverColumn === column.id
        return (
          <div
            key={column.id}
            className={cn("space-y-4 transition-all", isActiveDrop ? "ring-2 ring-primary/60 bg-primary/5" : "")}
            data-drop-column
            data-column-id={column.id}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </div>

            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <Card className="border-dashed">
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
                      className="group cursor-pointer transition-all hover:shadow-lg"
                      data-draggable-task
                      data-task-id={task.id}
                      onClick={(e) => handleTaskClick(task, e)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium leading-tight flex items-center gap-2">
                            <GripVertical 
                              className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" 
                              data-drag-handle
                            />
                            {task.title}
                          </CardTitle>
                          {task.aiAssigned && (
                            <Badge variant="secondary" className="ml-2 gap-1">
                              <Sparkles className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {assignedUser && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={assignedUser.avatar || "/placeholder.svg"} alt={assignedUser.name} />
                                <AvatarFallback className="text-xs">
                                  {assignedUser.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-xs text-muted-foreground">{assignedUser?.name}</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h
                          </div>
                        </div>

                        <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                        </Badge>
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
