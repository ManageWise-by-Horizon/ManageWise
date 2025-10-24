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
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function AppHeader() {
  const { user } = useAuth()
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
        return { 
          icon: <UserPlus className="h-4 w-4" />, 
          color: 'text-emerald-500', 
          bgColor: 'bg-emerald-50' 
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
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar proyectos, tareas..." className="pl-9" />
        </div>
      </div>

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
