"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Clock, 
  MessageCircle, 
  Activity, 
  Edit3, 
  Save, 
  X, 
  UserPlus,
  Calendar,
  Flag,
  Sparkles,
  Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { useProjectPermissions } from "@/hooks/use-project-permissions"

interface TaskDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    title: string
    description: string
    status: string
    assignedTo?: string
    priority: string
    estimatedHours: number
    projectId?: string
    userStoryId?: string
    aiAssigned?: boolean
    dueDate?: string
    createdAt?: string
  } | null
  members: Array<{
    id: string
    name: string
    email?: string
    role?: string
    avatar?: string
  }>
  onUpdate: () => void
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
}

interface Activity {
  id: string
  userId: string
  userName: string
  userAvatar: string
  action: string
  details: string
  createdAt: string
}

export function TaskDetailModal({ open, onOpenChange, task, members, onUpdate }: TaskDetailModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { hasPermission, userRole } = useProjectPermissions(task?.projectId || '', user?.id || '')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    if (task && open) {
      setEditedTitle(task.title)
      setEditedDescription(task.description || "")
      fetchComments()
      fetchActivities()
    }
  }, [task, open])

  const fetchComments = async () => {
    if (!task) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const fetchActivities = async () => {
    if (!task) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}/activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const handleSaveChanges = async () => {
    if (!task) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
        }),
      })

      if (response.ok) {
        toast({
          title: "Tarea actualizada",
          description: "Los cambios se han guardado correctamente",
        })
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    }
  }

  const handleAssignUser = async (userId: string) => {
    if (!task) return
    
    // Convert "unassigned" back to null/empty for the API
    const assignedToValue = userId === "unassigned" ? null : userId
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: assignedToValue,
        }),
      })

      if (response.ok) {
        toast({
          title: "Asignación actualizada",
          description: "La tarea se ha asignado correctamente",
        })
        onUpdate()
      }
    } catch (error) {
      console.error("Error assigning task:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar la tarea",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePriority = async (priority: string) => {
    if (!task) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: priority,
        }),
      })

      if (response.ok) {
        toast({
          title: "Prioridad actualizada",
          description: "La prioridad de la tarea se ha actualizado",
        })
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating priority:", error)
    }
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          userId: "current-user-id",
        }),
      })

      if (response.ok) {
        setNewComment("")
        fetchComments()
        toast({
          title: "Comentario añadido",
          description: "Tu comentario se ha publicado",
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500", 
      low: "bg-green-500",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      todo: { label: "Por Hacer", color: "bg-gray-500" },
      in_progress: { label: "En Progreso", color: "bg-blue-500" },
      done: { label: "Completado", color: "bg-green-500" },
    }
    return statusMap[status] || { label: status, color: "bg-muted" }
  }

  const assignedUser = task?.assignedTo ? members.find(m => m.id === task.assignedTo) : null

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-1"
                    placeholder="Título de la tarea"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveChanges} className="h-8">
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-8">
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">{task.title}</DialogTitle>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 w-7 p-0">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {task.aiAssigned && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Sparkles className="h-3 w-3" />
                        IA
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>en lista</span>
                    <Badge className={cn("text-white text-xs", getStatusBadge(task.status).color)}>
                      {getStatusBadge(task.status).label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-0 h-[650px]">
          {/* Main Content */}
          <div className="col-span-3 space-y-6 overflow-y-auto px-6 py-4">
            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Edit3 className="w-4 h-4" />
                Descripción
              </div>
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Añadir una descripción más detallada..."
                  className="min-h-[120px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:bg-background"
                />
              ) : (
                <div 
                  className="min-h-[80px] p-3 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description || "Crear mockups y diseño de interfaz"}
                  </p>
                </div>
              )}
            </div>

            {/* Comments and Activity */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="comments" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <MessageCircle className="w-4 h-4" />
                  Comentarios ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Activity className="w-4 h-4" />
                  Actividad ({activities.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-4 mt-4">
                {/* Add Comment */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:bg-background resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="h-8"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <ScrollArea className="h-[320px]">
                  <div className="space-y-4 pr-2">
                    {comments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No hay comentarios aún</p>
                        <p className="text-xs text-muted-foreground mt-1">Sé el primero en comentar</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                              {comment.userName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-background border rounded-lg p-3 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <ScrollArea className="h-[450px]">
                  <div className="space-y-4 pr-2">
                    {activities.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No hay actividad registrada</p>
                        <p className="text-xs text-muted-foreground mt-1">Las acciones aparecerán aquí</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-start">
                          <Avatar className="w-7 h-7 border border-border">
                            <AvatarImage src={activity.userAvatar} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {activity.userName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 pb-2">
                            <p className="text-sm leading-relaxed">
                              <span className="font-medium">{activity.userName}</span>{" "}
                              {activity.action}{" "}
                              <span className="text-muted-foreground">{activity.details}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="border-l bg-muted/20 px-4 py-4 space-y-6 overflow-y-auto">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Detalles
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" />
                Asignado a
              </Label>
              <Select value={task.assignedTo || "unassigned"} onValueChange={handleAssignUser}>
                <SelectTrigger className="h-9 bg-background border-0 shadow-sm">
                  <SelectValue placeholder="Sin asignar">
                    {assignedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assignedUser.avatar} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {assignedUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">Admin User</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin asignar</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Flag className="w-3 h-3" />
                Prioridad
              </Label>
              <Select value={task.priority} onValueChange={handleUpdatePriority}>
                <SelectTrigger className="h-9 bg-background border-0 shadow-sm">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", getPriorityColor(task.priority))} />
                      <span className="text-sm font-medium">
                        {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Alta
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Media
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Baja
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Tiempo estimado
              </Label>
              <div className="h-9 bg-background border-0 shadow-sm rounded-md px-3 flex items-center">
                <span className="text-sm font-medium">{task.estimatedHours}h</span>
              </div>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Fecha límite
                </Label>
                <div className="h-9 bg-background border-0 shadow-sm rounded-md px-3 flex items-center">
                  <span className="text-sm">{formatDate(task.dueDate)}</span>
                </div>
              </div>
            )}

            {/* Created */}
            {task.createdAt && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Creado</Label>
                <div className="h-9 bg-background border-0 shadow-sm rounded-md px-3 flex items-center">
                  <span className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}