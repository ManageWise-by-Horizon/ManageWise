"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Clock,
  User,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createApiUrl } from "@/lib/api-config"

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: "high" | "medium" | "low" | "Alta" | "Media" | "Baja"
  storyPoints: number
  status: string
  projectId: string
  createdBy: string
  createdAt: string
  aiGenerated?: boolean
  qualityMetrics?: {
    bleu: number
    rouge: number
  }
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "done"
  priority: "high" | "medium" | "low"
  assignedTo?: string
  estimatedHours: number
  userStoryId?: string
  projectId: string
  sprintId?: string
  createdAt: string
  aiAssigned?: boolean
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserStoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userStory: UserStory | null
  projectId: string
}

export function UserStoryDetailModal({ 
  open, 
  onOpenChange, 
  userStory, 
  projectId 
}: UserStoryDetailModalProps) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && userStory) {
      fetchRelatedData()
    }
  }, [open, userStory])

  const fetchRelatedData = async () => {
    if (!userStory) return
    
    setIsLoading(true)
    try {
      // Fetch tasks related to this user story
      const tasksRes = await fetch(createApiUrl('/tasks'))
      const allTasks = await tasksRes.json()
      
      // Filter tasks that belong to this user story
      const relatedTasks = allTasks.filter((task: Task) => 
        task.userStoryId === userStory.id
      )
      
      setTasks(relatedTasks)

      // Fetch users for assigned members
      const usersRes = await fetch(createApiUrl('/users'))
      const usersData = await usersRes.json()
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching related data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos relacionados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUser = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500 text-white",
      Alta: "bg-red-500 text-white",
      medium: "bg-yellow-500 text-white",
      Media: "bg-yellow-500 text-white", 
      low: "bg-green-500 text-white",
      Baja: "bg-green-500 text-white",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      todo: "border-gray-500 text-gray-700 bg-gray-50",
      in_progress: "border-blue-500 text-blue-700 bg-blue-50",
      done: "border-green-500 text-green-700 bg-green-50",
    }
    return colors[status as keyof typeof colors] || "border-gray-500 text-gray-700 bg-gray-50"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: "Por Hacer",
      in_progress: "En Progreso", 
      done: "Completado",
    }
    return labels[status as keyof typeof labels] || status
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === "todo"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    done: tasks.filter(t => t.status === "done"),
  }

  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0)
  const completedHours = tasksByStatus.done.reduce((sum, task) => sum + task.estimatedHours, 0)
  const progressPercentage = totalHours > 0 ? (completedHours / totalHours) * 100 : 0

  if (!userStory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getPriorityColor(userStory.priority)}>
                  {userStory.priority === "high" ? "Alta" : userStory.priority === "medium" ? "Media" : "Baja"}
                </Badge>
                <Badge variant="outline">{userStory.storyPoints} pts</Badge>
                {userStory.aiGenerated && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    IA
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{userStory.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">{userStory.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-6 pb-4">
            {/* Progress Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progreso General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-600">{tasksByStatus.todo.length}</div>
                    <div className="text-xs text-muted-foreground">Por Hacer</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{tasksByStatus.in_progress.length}</div>
                    <div className="text-xs text-muted-foreground">En Progreso</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{tasksByStatus.done.length}</div>
                    <div className="text-xs text-muted-foreground">Completado</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{completedHours}h completadas</span>
                    <span>{totalHours}h totales</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acceptance Criteria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Criterios de Aceptación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {userStory.acceptanceCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Related Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Tasks Relacionadas ({tasks.length})
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Cargando tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No hay tasks relacionadas</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Crear primera task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {tasks.map((task) => {
                      const assignedUser = getUser(task.assignedTo || "")
                      return (
                        <Card key={task.id} className="border-l-4 border-l-primary/20">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-1 flex-1">{task.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(task.status)}
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {assignedUser ? (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{assignedUser.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Sin asignar</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimatedHours}h
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quality Metrics (if AI generated) */}
            {userStory.aiGenerated && userStory.qualityMetrics && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Métricas de Calidad IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg border border-chart-1/20 bg-chart-1/5">
                      <div className="text-2xl font-bold">{(userStory.qualityMetrics.bleu * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">BLEU Score</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-chart-2/20 bg-chart-2/5">
                      <div className="text-2xl font-bold">{(userStory.qualityMetrics.rouge * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">ROUGE Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}