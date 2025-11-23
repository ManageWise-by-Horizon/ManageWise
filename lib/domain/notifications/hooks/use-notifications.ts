"use client"

import { useState, useEffect, useCallback } from 'react'
import { notificationService, type CreateNotificationCommand } from '../services/notification.service'
import type { Notification, NotificationFilters, NotificationStats } from '../types/notification.types'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/hooks/use-toast'

export function useNotifications(
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const data = await notificationService.getNotifications({
        ...filters,
        userId: user.id
      } as any)

      const notificationsArray = Array.isArray(data) ? data : []
      setNotifications(notificationsArray)

      // Calcular estadísticas
      const unread = notificationsArray.filter((n: Notification) => !n.read).length
      const byType: Record<string, number> = {}
      const byProject: Record<string, number> = {}

      notificationsArray.forEach((n: Notification) => {
        byType[n.type] = (byType[n.type] || 0) + 1
        if (n.projectId) {
          byProject[n.projectId] = (byProject[n.projectId] || 0) + 1
        }
      })

      setStats({
        total: notificationsArray.length,
        unread,
        byType: byType as any,
        byProject
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      
      const isConnectionError = errorMessage.includes('conexión') || 
                               errorMessage.includes('Network') ||
                               errorMessage.includes('Failed to fetch') ||
                               errorMessage.includes('CORS')
      
      if (!isConnectionError) {
        toast({
          title: "Error al cargar notificaciones",
          description: errorMessage,
          variant: "destructive"
        })
      }
      
      setNotifications([])
      setStats({
        total: 0,
        unread: 0,
        byType: {} as any,
        byProject: {}
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const updated = await notificationService.markAsRead(notificationId)
      setNotifications(prev => prev.map(n => n.id === notificationId ? updated : n))
      
      // Actualizar stats
      if (stats) {
        setStats({
          ...stats,
          unread: Math.max(0, stats.unread - 1)
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }, [stats, toast])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    
    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      
      if (stats) {
        setStats({
          ...stats,
          unread: 0
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }, [user, stats, toast])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Actualizar stats
      if (stats) {
        const deleted = notifications.find(n => n.id === notificationId)
        const wasUnread = deleted && !deleted.read
        setStats({
          total: stats.total - 1,
          unread: wasUnread ? Math.max(0, stats.unread - 1) : stats.unread,
          byType: { ...stats.byType },
          byProject: { ...stats.byProject }
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }, [notifications, stats, toast])

  const createNotification = useCallback(async (command: CreateNotificationCommand) => {
    try {
      const newNotification = await notificationService.createNotification(command)
      setNotifications(prev => [newNotification, ...prev])
      return newNotification
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }, [toast])

  // Auto-refresh
  useEffect(() => {
    if (!user || !autoRefresh) return

    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [user, autoRefresh, refreshInterval, fetchNotifications])

  // Funciones de utilidad para compatibilidad
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read)
  }, [notifications])

  const getNotificationsByProject = useCallback((projectId: string) => {
    return notifications.filter(n => n.projectId === projectId)
  }, [notifications])

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  const refreshNotifications = useCallback(() => {
    return fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount: stats?.unread || 0,
    stats,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead: () => markAllAsRead(),
    deleteNotification,
    createNotification,
    getUnreadNotifications,
    getNotificationsByProject,
    getNotificationsByType,
    refreshNotifications,
    retryFailedNotifications: async () => {
      // Implementación futura para reintentos
      await refreshNotifications()
    },
    createSystemErrorNotification: async (
      userId: string,
      errorType: string,
      errorMessage: string,
      affectedResources?: string[]
    ) => {
      await createNotification({
        userId,
        type: 'system_alert',
        title: `Error del sistema: ${errorType}`,
        message: errorMessage,
        data: {
          errorType,
          errorMessage,
          affectedResources
        }
      })
    }
  }
}

