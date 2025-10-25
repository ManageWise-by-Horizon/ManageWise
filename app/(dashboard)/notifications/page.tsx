"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bell, CheckCircle, AlertCircle, Clock, Trash2, RefreshCw, Filter, Search, MessageSquare, UserPlus, Shield } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { InvitationNotification } from "@/components/notifications/invitation-notification"
import { Notification, NotificationType } from "@/lib/types/notifications"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    retryFailedNotifications,
    refreshNotifications
  } = useNotifications()

  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Escenario 2: Función para aceptar invitación
  const handleAcceptInvitation = async (notificationId: string, projectId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para aceptar invitaciones",
        variant: "destructive",
      })
      return
    }

    try {
      // Obtener el proyecto actual
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
      const project = await projectRes.json()

      // Verificar si el usuario ya es miembro (Escenario 4)
      if (project.members.includes(user.id)) {
        toast({
          title: "Ya eres miembro",
          description: "Ya perteneces a este proyecto",
          variant: "destructive",
        })
        return
      }

      // Agregar usuario al proyecto
      const updatedMembers = [...project.members, user.id]
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: updatedMembers }),
      })

      // Marcar notificación como leída
      await markAsRead(notificationId)

      // Actualizar el estado de la invitación si existe
      const invitationsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projectInvitations?projectId=${projectId}&email=${user.email}`)
      const invitations = await invitationsRes.json()
      if (invitations.length > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projectInvitations/${invitations[0].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        })
      }

      // Crear notificación de confirmación para el que invitó
      const notification = notifications.find(n => n.id === notificationId)
      if (notification?.data?.invitedBy) {
        const confirmationNotification = {
          id: `notif_accept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: notification.data.invitedBy,
          projectId,
          type: "invitation_accepted",
          title: "Invitación aceptada",
          message: `${user.name} ha aceptado tu invitación al proyecto "${notification.data.projectName}"`,
          data: {
            projectId,
            projectName: notification.data.projectName,
            acceptedBy: user.id,
            acceptedByName: user.name,
            changeType: "accepted"
          },
          read: false,
          createdAt: new Date().toISOString(),
          deliveryStatus: "delivered"
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(confirmationNotification),
        })
      }

    } catch (error) {
      console.error("Error accepting invitation:", error)
      throw error
    }
  }

  // Escenario 3: Función para rechazar invitación
  const handleDeclineInvitation = async (notificationId: string, invitationId?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para rechazar invitaciones",
        variant: "destructive",
      })
      return
    }

    try {
      // Marcar notificación como leída
      await markAsRead(notificationId)

      // Actualizar el estado de la invitación si existe
      if (invitationId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projectInvitations/${invitationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "declined" }),
        })
      } else {
        // Buscar invitación por email del usuario y projectId
        const notification = notifications.find(n => n.id === notificationId)
        if (notification?.data?.projectId) {
          const invitationsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projectInvitations?projectId=${notification.data.projectId}&email=${user.email}`)
          const invitations = await invitationsRes.json()
          if (invitations.length > 0) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projectInvitations/${invitations[0].id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "declined" }),
            })
          }
        }
      }

      // Crear notificación de confirmación para el que invitó
      const notification = notifications.find(n => n.id === notificationId)
      if (notification?.data?.invitedBy) {
        const confirmationNotification = {
          id: `notif_decline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: notification.data.invitedBy,
          projectId: notification.data.projectId,
          type: "invitation_declined",
          title: "Invitación rechazada",
          message: `${user.name} ha rechazado tu invitación al proyecto "${notification.data.projectName}"`,
          data: {
            projectId: notification.data.projectId,
            projectName: notification.data.projectName,
            declinedBy: user.id,
            declinedByName: user.name,
            changeType: "declined"
          },
          read: false,
          createdAt: new Date().toISOString(),
          deliveryStatus: "delivered"
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(confirmationNotification),
        })
      }

    } catch (error) {
      console.error("Error declining invitation:", error)
      throw error
    }
  }

  // Filtrar notificaciones basado en los filtros activos
  useEffect(() => {
    let filtered = notifications

    // Filtro por tipo de tab
    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.read)
    } else if (activeTab === "errors") {
      filtered = filtered.filter(n => n.type === 'system_error' || n.deliveryStatus === 'failed')
    }

    // Filtro por tipo de notificación
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Filtro por estado de lectura
    if (statusFilter === "read") {
      filtered = filtered.filter(n => n.read)
    } else if (statusFilter === "unread") {
      filtered = filtered.filter(n => !n.read)
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, activeTab, typeFilter, statusFilter, searchTerm])

  const getNotificationIcon = (type: NotificationType, deliveryStatus?: string) => {
    if (deliveryStatus === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    
    switch (type) {
      case 'system_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'system_recovery':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'task_updated':
      case 'task_assigned':
      case 'task_completed':
      case 'task_status_changed':
      case 'task_priority_changed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'task_commented':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      case 'okr_updated':
      case 'okr_created':
        return <Bell className="h-4 w-4 text-purple-500" />
      case 'project_invitation':
        return <UserPlus className="h-4 w-4 text-green-600" />
      case 'project_role_changed':
      case 'member_role_updated':
        return <Shield className="h-4 w-4 text-indigo-500" />
      case 'project_updated':
      case 'project_status_changed':
        return <Bell className="h-4 w-4 text-cyan-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      'task_updated': 'Tarea Actualizada',
      'task_assigned': 'Tarea Asignada',
      'task_completed': 'Tarea Completada',
      'task_created': 'Tarea Creada',
      'task_commented': 'Comentario en Tarea',
      'task_status_changed': 'Estado de Tarea',
      'task_priority_changed': 'Prioridad de Tarea',
      'okr_updated': 'OKR Actualizado',
      'okr_created': 'OKR Creado',
      'okr_completed': 'OKR Completado',
      'project_updated': 'Proyecto Actualizado',
      'project_status_changed': 'Estado de Proyecto',
      'project_invitation': 'Invitación a Proyecto',
      'email_invitation': 'Invitación por Email',
      'invitation_accepted': 'Invitación Aceptada',
      'invitation_declined': 'Invitación Rechazada',
      'project_role_changed': 'Cambio de Rol',
      'sprint_created': 'Sprint Creado',
      'sprint_completed': 'Sprint Completado',
      'member_added': 'Miembro Agregado',
      'member_removed': 'Miembro Removido',
      'member_role_updated': 'Rol de Miembro',
      'system_error': 'Error del Sistema',
      'system_recovery': 'Recuperación del Sistema'
    }
    return labels[type] || type
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Debes iniciar sesión para ver las notificaciones</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas tus notificaciones y alertas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={retryFailedNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar fallidas
          </Button>
          <Button onClick={refreshNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin leer</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errores</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.type === 'system_error' || n.deliveryStatus === 'failed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recuperadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'system_recovery').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType | "all")}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de notificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="task_assigned">Tareas Asignadas</SelectItem>
                  <SelectItem value="task_commented">Comentarios</SelectItem>
                  <SelectItem value="task_status_changed">Estados de Tarea</SelectItem>
                  <SelectItem value="project_invitation">Invitaciones a Proyecto</SelectItem>
                  <SelectItem value="email_invitation">Invitaciones por Email</SelectItem>
                  <SelectItem value="invitation_accepted">Invitaciones Aceptadas</SelectItem>
                  <SelectItem value="invitation_declined">Invitaciones Rechazadas</SelectItem>
                  <SelectItem value="project_role_changed">Cambios de Rol</SelectItem>
                  <SelectItem value="okr_updated">OKRs</SelectItem>
                  <SelectItem value="project_updated">Proyectos</SelectItem>
                  <SelectItem value="system_error">Errores del Sistema</SelectItem>
                  <SelectItem value="system_recovery">Recuperación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "read" | "unread")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
                <SelectItem value="unread">Sin leer</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer ({notifications.filter(n => !n.read).length})
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errores ({notifications.filter(n => n.type === 'system_error' || n.deliveryStatus === 'failed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay notificaciones que mostrar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => {
                // Usar componente especializado para invitaciones
                if (notification.type === 'project_invitation' || notification.type === 'email_invitation') {
                  return (
                    <InvitationNotification
                      key={notification.id}
                      notification={notification}
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                      onMarkAsRead={markAsRead}
                      compact={false}
                    />
                  )
                }

                // Renderizado normal para otros tipos de notificación
                return (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                    } ${
                      notification.deliveryStatus === 'failed' ? 'border-l-4 border-l-red-500 bg-red-50/50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type, notification.deliveryStatus)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                              {notification.deliveryStatus === 'failed' && (
                                <Badge variant="destructive" className="text-xs">
                                  Fallo de entrega
                                </Badge>
                              )}
                              {notification.retryCount && notification.retryCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Reintentos: {notification.retryCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(notification.createdAt), 'PPp', { locale: es })}
                              </span>
                              {notification.readAt && (
                                <span>
                                  Leída: {format(new Date(notification.readAt), 'PPp', { locale: es })}
                                </span>
                              )}
                              {notification.failureReason && (
                                <span className="text-red-600">
                                  Error: {notification.failureReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              variant="outline"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(notification.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}