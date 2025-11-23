"use client"

import { useState, useEffect, useLayoutEffect, useCallback } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Sparkles, GripVertical, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { TaskDetailModal } from "./task-detail-modal"
import { createApiUrl } from "@/lib/api-config"
import { taskService } from "@/lib/domain/tasks/services/task.service"

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

interface UserStory {
  id: string
  sprintId?: string | null
}

interface Sprint {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
}

interface ProjectBoardProps {
  projectId: string
  tasks: ProjectTask[]
  members: User[]
  userStories?: UserStory[]
  sprints?: Sprint[]
  onUpdate: () => void
}

export function ProjectBoard({ projectId, tasks, members, userStories = [], sprints = [], onUpdate }: ProjectBoardProps) {
  const { toast } = useToast()
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>("all")
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set())

  // Expandir todos los sprints por defecto cuando cambian los sprints
  useEffect(() => {
    if (sprints.length > 0) {
      setExpandedSprints(new Set([...sprints.map(s => s.id), "unassigned"]))
    }
  }, [sprints])

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    try {
      // Map normalized status back to backend format
      const mapStatusToBackend = (status: string): "TODO" | "IN_PROGRESS" | "DONE" => {
        if (status === "todo") return "TODO"
        if (status === "in_progress") return "IN_PROGRESS"
        if (status === "done") return "DONE"
        return "TODO" // default
      }

      // Map priority from frontend format to backend format
      const mapPriorityToBackend = (priority: string): "ALTA" | "MEDIA" | "BAJA" => {
        if (priority === "high") return "ALTA"
        if (priority === "medium") return "MEDIA"
        if (priority === "low") return "BAJA"
        return "MEDIA" // default
      }

      const backendStatus = mapStatusToBackend(newStatus)
      
      // Get the current task to preserve other fields
      const currentTask = tasks.find(t => t.id === taskId)
      if (!currentTask) {
        throw new Error("Task not found")
      }

      // Get the full task from backend to ensure we have all required fields
      const fullTask = await taskService.getTaskById(taskId)
      
      console.log('[ProjectBoard] Full task from backend:', JSON.stringify(fullTask, null, 2))
      console.log('[ProjectBoard] Updating task with status:', backendStatus)

      // Validate that all required fields are present
      if (!fullTask.title || !fullTask.description || fullTask.estimatedHours === undefined || !fullTask.priority) {
        throw new Error('Task data is incomplete. Missing required fields.')
      }

      // Update task using DDD service - send all required fields
      await taskService.updateTask(taskId, {
        id: taskId,
        title: fullTask.title,
        description: fullTask.description,
        estimatedHours: fullTask.estimatedHours,
        status: backendStatus,
        priority: fullTask.priority, // Use current priority from backend
        assignedTo: fullTask.assignedTo || null, // Ensure it's null if undefined
      })
      
      toast({
        title: "Tarea actualizada",
        description: "El estado de la tarea se ha actualizado correctamente",
      })
      onUpdate()
    } catch (error) {
      console.error("Error updating task:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.responseText || (error as any)?.details?.message || "No se pudo actualizar la tarea"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [tasks, toast, onUpdate])

  // Drag-and-drop setup
  useLayoutEffect(() => {
    // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
    const frameId = requestAnimationFrame(() => {
      const draggables = document.querySelectorAll('[data-draggable-task]')
      console.log('[ProjectBoard] Inicializando drag-and-drop para', draggables.length, 'tareas')
      
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
    })

    return () => {
      cancelAnimationFrame(frameId)
      setDragOverColumn(null)
    }
  }, [tasks, updateTaskStatus, selectedSprintFilter, sprints])

  const normalizeStatus = (status: string): "todo" | "in_progress" | "done" => {
    if (status === "pending" || status === "to_do" || status === "todo") return "todo"
    if (status === "in_progress" || status === "in-progress" || status === "active") return "in_progress"  
    if (status === "done" || status === "completed" || status === "finished") return "done"
    return "todo"
  }

  const getUser = (userId: string) => {
    return members.find((u) => u.id === userId)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const columns = [
    { id: "todo", title: "Por Hacer", status: "todo" },
    { id: "in_progress", title: "En Progreso", status: "in_progress" },
    { id: "done", title: "Completado", status: "done" },
  ]

  // Crear mapa de userStoryId -> sprintId
  const userStoryToSprintMap = new Map<string, string | null>()
  userStories.forEach((us) => {
    userStoryToSprintMap.set(us.id, us.sprintId || null)
  })

  // Debug: Log para verificar el mapeo
  useEffect(() => {
    console.log('[ProjectBoard] Sprints recibidos:', sprints.length, sprints)
    console.log('[ProjectBoard] Sprints detalles:', sprints.map(s => ({ id: s.id, title: s.title })))
    if (sprints.length > 0 || userStories.length > 0 || tasks.length > 0) {
      console.log('[ProjectBoard] User Stories con sprintId:', userStories.filter(us => us.sprintId).map(us => ({ id: us.id, sprintId: us.sprintId })))
      console.log('[ProjectBoard] Tasks con userStoryId:', tasks.filter(t => t.userStoryId).map(t => ({ id: t.id, userStoryId: t.userStoryId })))
      console.log('[ProjectBoard] Sprint seleccionado:', selectedSprintFilter)
    }
  }, [sprints, userStories, tasks, selectedSprintFilter])

  // Agrupar tareas por sprint
  const getTasksBySprint = (sprintId: string | null) => {
    return tasks.filter((task) => {
      if (!task.userStoryId) return sprintId === null
      const taskSprintId = userStoryToSprintMap.get(task.userStoryId)
      return taskSprintId === sprintId
    })
  }

  // Obtener tareas sin sprint asignado
  const getUnassignedTasks = () => {
    return tasks.filter((task) => {
      if (!task.userStoryId) return true
      const taskSprintId = userStoryToSprintMap.get(task.userStoryId)
      return !taskSprintId || taskSprintId === null
    })
  }

  const getTasksByNormalizedStatus = (normalizedStatus: string, sprintId?: string | null) => {
    let filteredTasks = tasks
    
    // Filtrar por sprint si se especifica
    if (sprintId !== undefined) {
      filteredTasks = getTasksBySprint(sprintId)
    }
    
    return filteredTasks.filter((t) => normalizeStatus(t.status) === normalizedStatus)
  }

  const toggleSprintExpanded = (sprintId: string) => {
    setExpandedSprints((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sprintId)) {
        newSet.delete(sprintId)
      } else {
        newSet.add(sprintId)
      }
      return newSet
    })
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
          <Select value={selectedSprintFilter} onValueChange={(value) => {
            console.log('[ProjectBoard] Cambiando filtro de sprint a:', value)
            setSelectedSprintFilter(value)
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Tareas</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.title}
                </SelectItem>
              ))}
              <SelectItem value="unassigned">Tareas sin Sprint</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{tasks.length} tareas totales</Badge>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-3 h-[500px]">
        {columns.map((column) => {
          // Filtrar tareas según el sprint seleccionado
          let columnTasks: ProjectTask[] = []
          if (selectedSprintFilter === "all") {
            columnTasks = getTasksByNormalizedStatus(column.status)
          } else if (selectedSprintFilter === "unassigned") {
            const unassignedTasks = getUnassignedTasks()
            columnTasks = unassignedTasks.filter((t) => normalizeStatus(t.status) === column.status)
          } else {
            // Filtrar por sprint específico
            const sprintTasks = getTasksBySprint(selectedSprintFilter)
            columnTasks = sprintTasks.filter((t) => normalizeStatus(t.status) === column.status)
          }
          
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
                  maxHeight: '400px',
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
                ) : selectedSprintFilter === "all" && sprints.length > 0 ? (
                  // Mostrar agrupado por sprint
                  <>
                    {/* Tareas por sprint */}
                    {sprints.map((sprint) => {
                      const sprintTasks = columnTasks.filter((task) => {
                        if (!task.userStoryId) return false
                        const taskSprintId = userStoryToSprintMap.get(task.userStoryId)
                        return taskSprintId === sprint.id
                      })
                      
                      if (sprintTasks.length === 0) return null
                      
                      const isExpanded = expandedSprints.has(sprint.id)
                      
                      return (
                        <Collapsible
                          key={sprint.id}
                          open={isExpanded}
                          onOpenChange={() => toggleSprintExpanded(sprint.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <Card className="mb-2 border-l-4 border-l-chart-1">
                              <CardContent className="p-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-chart-1" />
                                    <div>
                                      <p className="text-sm font-medium">{sprint.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {sprintTasks.length} {sprintTasks.length === 1 ? 'tarea' : 'tareas'}
                                      </p>
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-2 mb-3">
                              {sprintTasks.map((task) => {
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
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                    
                    {/* Tareas sin sprint */}
                    {(() => {
                      const unassignedTasks = columnTasks.filter((task) => {
                        if (!task.userStoryId) return true
                        const taskSprintId = userStoryToSprintMap.get(task.userStoryId)
                        return !taskSprintId || taskSprintId === null
                      })
                      
                      if (unassignedTasks.length === 0) return null
                      
                      const isExpanded = expandedSprints.has("unassigned")
                      
                      return (
                        <Collapsible
                          key="unassigned"
                          open={isExpanded}
                          onOpenChange={() => toggleSprintExpanded("unassigned")}
                        >
                          <CollapsibleTrigger className="w-full">
                            <Card className="mb-2 border-l-4 border-l-muted">
                              <CardContent className="p-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">Sin Sprint</p>
                                      <p className="text-xs text-muted-foreground">
                                        {unassignedTasks.length} {unassignedTasks.length === 1 ? 'tarea' : 'tareas'}
                                      </p>
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-2 mb-3">
                              {unassignedTasks.map((task) => {
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
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })()}
                  </>
                ) : (
                  // Mostrar tareas sin agrupar (cuando se filtra por un sprint específico)
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