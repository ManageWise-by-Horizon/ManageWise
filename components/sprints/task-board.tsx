"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Sparkles } from "lucide-react"

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

export function TaskBoard({ tasks, onUpdate }: TaskBoardProps) {
  const [users, setUsers] = useState<any[]>([])

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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status)
        return (
          <div key={column.id} className="space-y-4">
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
                    <Card key={task.id} className="group cursor-pointer transition-all hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
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
    </div>
  )
}
