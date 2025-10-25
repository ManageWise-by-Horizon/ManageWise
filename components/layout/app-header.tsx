"use client"

import React from "react"
import Link from "next/link"
import { Bell, Search, CheckCircle, MessageSquare, UserPlus, Shield, Calendar, AlertTriangle, Users, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { InvitationNotification } from "@/components/notifications/invitation-notification"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function AppHeader() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isLoading 
  } = useNotifications()

  // Obtener las últimas 5 notificaciones para mostrar en el dropdown
  const recentNotifications = notifications.slice(0, 5)

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

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

  // Función para obtener el icono y color de cada tipo de notificación
  const getNotificationIconAndColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'text-blue-500', 
          bgColor: 'bg-blue-50' 
        }
      case 'task_commented':
        return { 
          icon: <MessageSquare className="h-4 w-4" />, 
          color: 'text-orange-500', 
          bgColor: 'bg-orange-50' 
        }
      case 'task_status_changed':
        return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'text-green-500', 
          bgColor: 'bg-green-50' 
        }
      case 'task_priority_changed':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-yellow-500', 
          bgColor: 'bg-yellow-50' 
        }
      case 'project_invitation':
      case 'email_invitation':
        return { 
          icon: <UserPlus className="h-4 w-4" />, 
          color: 'text-emerald-500', 
          bgColor: 'bg-emerald-50' 
        }
      case 'invitation_accepted':
        return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50' 
        }
      case 'invitation_declined':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-red-500', 
          bgColor: 'bg-red-50' 
        }
      case 'project_role_changed':
        return { 
          icon: <Shield className="h-4 w-4" />, 
          color: 'text-indigo-500', 
          bgColor: 'bg-indigo-50' 
        }
      case 'sprint_completed':
        return { 
          icon: <Target className="h-4 w-4" />, 
          color: 'text-purple-500', 
          bgColor: 'bg-purple-50' 
        }
      case 'okr_updated':
      case 'okr_created':
        return { 
          icon: <Target className="h-4 w-4" />, 
          color: 'text-violet-500', 
          bgColor: 'bg-violet-50' 
        }
      case 'member_added':
      case 'member_removed':
        return { 
          icon: <Users className="h-4 w-4" />, 
          color: 'text-cyan-500', 
          bgColor: 'bg-cyan-50' 
        }
      case 'project_updated':
        return { 
          icon: <Calendar className="h-4 w-4" />, 
          color: 'text-slate-500', 
          bgColor: 'bg-slate-50' 
        }
      default:
        return { 
          icon: <Bell className="h-4 w-4" />, 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-50' 
        }
    }
  }
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="w-64 pl-10" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive p-0 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Cargando notificaciones...
            </div>
          ) : !user ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Iniciando sesión...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            <>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Mostrando {recentNotifications.length} de {notifications.length} notificaciones
              </div>
              {recentNotifications.map((notification, index) => {
                console.log(`🔔 RENDERING notification ${index}:`, {
                  id: notification.id,
                  title: notification.title,
                  message: notification.message,
                  createdAt: notification.createdAt,
                  read: notification.read
                })
                
                // Usar componente especializado para invitaciones de proyecto
                if (notification.type === 'project_invitation' || notification.type === 'email_invitation') {
                  return (
                    <InvitationNotification
                      key={notification.id}
                      notification={notification}
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                      onMarkAsRead={markAsRead}
                      compact={true}
                    />
                  )
                }
                
                const { icon, color, bgColor } = getNotificationIconAndColor(notification.type)
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`cursor-pointer ${!notification.read ? 'bg-muted/50' : ''} hover:bg-muted/30 transition-colors`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex gap-3 w-full">
                      {/* Icono con color de fondo */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${color}`}>
                        {icon}
                      </div>
                      
                      {/* Contenido de la notificación */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center" asChild>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="w-full">
                    Ver todas las notificaciones
                  </Button>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
