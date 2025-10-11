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
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [localTask, setLocalTask] = useState(task)

  useEffect(() => {
    if (task && open) {
      setLocalTask(task)
      setEditedTitle(task.title)
      setEditedDescription(task.description || "")
      fetchComments()
      fetchActivities()
    }
  }, [task, open])

  useEffect(() => {
    setLocalTask(task)
  }, [task])

  const fetchComments = async () => {
    if (!localTask) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const fetchActivities = async () => {
    if (!localTask) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}/activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const handleSaveChanges = async () => {
    if (!localTask) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}`, {
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
        // Update local state immediately
        setLocalTask(prev => prev ? { ...prev, title: editedTitle, description: editedDescription } : prev)
        
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
    if (!localTask) return
    
    // Convert "unassigned" back to null/empty for the API
    const assignedToValue = userId === "unassigned" ? null : userId
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: assignedToValue,
        }),
      })

      if (response.ok) {
        // Update local task state immediately for real-time update
        setLocalTask(prev => prev ? { ...prev, assignedTo: assignedToValue || undefined } : prev)
        
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
    if (!localTask) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: priority,
        }),
      })

      if (response.ok) {
        // Update local state immediately
        setLocalTask(prev => prev ? { ...prev, priority } : prev)
        
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
    if (!localTask || !newComment.trim()) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${localTask.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          userId: user?.id || "current-user-id",
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

  const assignedUser = localTask?.assignedTo ? members.find(m => m.id === localTask.assignedTo) : null

  if (!localTask) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden sm:max-w-7xl md:max-w-7xl lg:max-w-7xl xl:max-w-7xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveChanges}>
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{localTask.title}</DialogTitle>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {localTask.aiAssigned && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      IA
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-[600px]">
          {/* Main Content */}
          <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Añadir una descripción más detallada..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {localTask.description || "Sin descripción"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments and Activity */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comentarios ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad ({activities.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-4">
                {/* Add Comment */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Comentar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay comentarios aún
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="activity">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay actividad registrada
                      </p>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-start">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={activity.userAvatar} />
                            <AvatarFallback className="text-xs">{activity.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.userName}</span>{" "}
                              {activity.action}{" "}
                              <span className="text-muted-foreground">{activity.details}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4 overflow-y-auto pr-2 max-h-[600px]">
            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={cn("text-white", getStatusBadge(localTask.status).color)}>
                  {getStatusBadge(localTask.status).label}
                </Badge>
              </CardContent>
            </Card>

            {/* Assigned To */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Asignado a
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={localTask.assignedTo || "unassigned"} onValueChange={handleAssignUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar">
                      {assignedUser && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={assignedUser.avatar} />
                            <AvatarFallback className="text-xs">{assignedUser.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignedUser.name}</span>
                        </div>
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
              </CardContent>
            </Card>

            {/* Priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Prioridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={localTask.priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getPriorityColor(localTask.priority))} />
                        <span className="text-sm">
                          {localTask.priority === "high" ? "Alta" : localTask.priority === "medium" ? "Media" : "Baja"}
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
              </CardContent>
            </Card>

            {/* Estimated Hours */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tiempo estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{localTask.estimatedHours}h</p>
              </CardContent>
            </Card>

            {/* Due Date */}
            {localTask.dueDate && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha límite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(localTask.dueDate)}</p>
                </CardContent>
              </Card>
            )}

            {/* Created */}
            {localTask.createdAt && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Creado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{formatDate(localTask.createdAt)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}