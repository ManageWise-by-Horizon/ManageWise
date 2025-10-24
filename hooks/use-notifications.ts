"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createApiUrl, apiRequest } from '@/lib/api-config'
import type { 
  Notification, 
  NotificationFilters, 
  NotificationStats,
  CreateNotificationRequest,
  NotificationType 
} from '@/lib/types/notifications'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats | null
  isLoading: boolean
  error: string | null
  
  // Funciones principales
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: (projectId?: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  createNotification: (request: CreateNotificationRequest) => Promise<void>
  
  // Funciones de utilidad
  getUnreadNotifications: () => Notification[]
  getNotificationsByProject: (projectId: string) => Notification[]
  getNotificationsByType: (type: NotificationType) => Notification[]
  
  // Reintentos y recuperación
  retryFailedNotifications: () => Promise<void>
  refreshNotifications: () => Promise<void>
  createSystemErrorNotification: (userId: string, errorType: string, errorMessage: string, affectedResources?: string[]) => Promise<void>
}

export function useNotifications(
  autoRefresh: boolean = true,
  refreshInterval: number = 30000 // 30 segundos
): UseNotificationsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener notificaciones del usuario
  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Construir query params
      const params = new URLSearchParams()
      params.append('userId', user.id)
      
      if (filters?.projectId) params.append('projectId', filters.projectId)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.read !== undefined) params.append('read', filters.read.toString())
      if (filters?.dateFrom) params.append('createdAt_gte', filters.dateFrom)
      if (filters?.dateTo) params.append('createdAt_lte', filters.dateTo)

      // Ordenar por fecha de creación descendente
      params.append('_sort', 'createdAt')
      params.append('_order', 'desc')

      const url = createApiUrl(`/notifications?${params.toString()}`)
      const response = await apiRequest(url)

      if (!response.ok) {
        throw new Error('Error al cargar las notificaciones')
      }

      const notificationsData = await response.json()
      console.log('🔔 fetchNotifications: Raw API response:', notificationsData)
      console.log('🔔 fetchNotifications: Setting notifications to state')
      
      setNotifications(notificationsData)

      // Calcular estadísticas
      const unread = notificationsData.filter((n: Notification) => !n.read).length
      const byType: Record<string, number> = {}
      const byProject: Record<string, number> = {}

      notificationsData.forEach((n: Notification) => {
        byType[n.type] = (byType[n.type] || 0) + 1
        if (n.projectId) {
          byProject[n.projectId] = (byProject[n.projectId] || 0) + 1
        }
      })

      setStats({
        total: notificationsData.length,
        unread,
        byType: byType as Record<NotificationType, number>,
        byProject
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: "Error al cargar notificaciones",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const url = createApiUrl(`/notifications/${notificationId}`)
      const response = await apiRequest(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          read: true,
          readAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Error al marcar como leída')
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      )

      // Actualizar stats
      setStats(prev => prev ? {
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      } : null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error al marcar notificación",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [toast])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async (projectId?: string) => {
    if (!user) return

    try {
      const unreadNotifications = notifications.filter(n => 
        !n.read && (!projectId || n.projectId === projectId)
      )

      // Actualizar cada notificación no leída
      await Promise.all(unreadNotifications.map(async (notification) => {
        const url = createApiUrl(`/notifications/${notification.id}`)
        return apiRequest(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            read: true,
            readAt: new Date().toISOString()
          })
        })
      }))

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          !n.read && (!projectId || n.projectId === projectId)
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      )

      // Actualizar stats
      setStats(prev => prev ? {
        ...prev,
        unread: prev.unread - unreadNotifications.length
      } : null)

      toast({
        title: "Notificaciones marcadas como leídas",
        description: `${unreadNotifications.length} notificaciones actualizadas`
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error al marcar todas como leídas",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [user, notifications, toast])

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const url = createApiUrl(`/notifications/${notificationId}`)
      const response = await apiRequest(url, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('Error al eliminar notificación')
      }

      const deletedNotification = notifications.find(n => n.id === notificationId)

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Actualizar stats
      setStats(prev => prev ? {
        ...prev,
        total: prev.total - 1,
        unread: deletedNotification && !deletedNotification.read ? prev.unread - 1 : prev.unread
      } : null)

      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada exitosamente"
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error deleting notification:', err)
      toast({
        title: "Error al eliminar notificación",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [notifications, toast])

  // Crear nueva notificación
  const createNotification = useCallback(async (request: CreateNotificationRequest) => {
    try {
      const newNotification = {
        id: `notif_${Date.now()}`,
        ...request,
        read: false,
        createdAt: new Date().toISOString(),
        readAt: null
      }

      const url = createApiUrl('/notifications')
      const response = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      })

      if (!response.ok) {
        throw new Error('Error al crear notificación')
      }

      // Si es para el usuario actual, agregarlo al estado
      if (request.userId === user?.id) {
        setNotifications(prev => [newNotification, ...prev])
        setStats(prev => prev ? {
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1
        } : null)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error creating notification:', err)
      
      // En caso de error, almacenar para reintento
      const failedNotification = {
        ...request,
        timestamp: new Date().toISOString(),
        retryCount: 0
      }
      
      // Almacenar en localStorage para reintento posterior
      const failed = JSON.parse(localStorage.getItem('failedNotifications') || '[]')
      failed.push(failedNotification)
      localStorage.setItem('failedNotifications', JSON.stringify(failed))
      
      throw new Error(errorMessage)
    }
  }, [user, toast])

  // Funciones de utilidad
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read)
  }, [notifications])

  const getNotificationsByProject = useCallback((projectId: string) => {
    return notifications.filter(n => n.projectId === projectId)
  }, [notifications])

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  // Crear notificación de error del sistema
  const createSystemErrorNotification = useCallback(async (
    userId: string, 
    errorType: string, 
    errorMessage: string,
    affectedResources?: string[]
  ) => {
    try {
      await createNotification({
        userId,
        type: 'system_error',
        title: 'Error del sistema',
        message: `Se ha detectado un error: ${errorMessage}`,
        data: {
          errorType,
          errorMessage,
          affectedNotifications: affectedResources
        }
      })
    } catch (error) {
      console.error('Failed to create system error notification:', error)
      // No lanzar el error para evitar bucles infinitos
    }
  }, [createNotification])

  // Reintentar notificaciones fallidas
  const retryFailedNotifications = useCallback(async () => {
    try {
      const failed = JSON.parse(localStorage.getItem('failedNotifications') || '[]')
      if (failed.length === 0) return

      const successful = []
      const stillFailed = []

      for (const notification of failed) {
        try {
          await createNotification(notification)
          successful.push(notification)
        } catch {
          if (notification.retryCount < 3) {
            stillFailed.push({
              ...notification,
              retryCount: notification.retryCount + 1
            })
          } else {
            // Después de 3 intentos, crear notificación de error del sistema
            if (user) {
              await createSystemErrorNotification(
                user.id,
                'notification_delivery',
                `No se pudo entregar la notificación: ${notification.title}`,
                [notification.id]
              )
            }
          }
        }
      }

      localStorage.setItem('failedNotifications', JSON.stringify(stillFailed))

      if (successful.length > 0) {
        toast({
          title: "Notificaciones recuperadas",
          description: `${successful.length} notificaciones enviadas exitosamente`
        })
        
        // Crear notificación de recuperación del sistema
        if (user) {
          await createNotification({
            userId: user.id,
            type: 'system_recovery',
            title: 'Sistema recuperado',
            message: `Se recuperaron ${successful.length} notificaciones pendientes`,
            data: {
              errorType: 'notification_delivery',
              recoveredAt: new Date().toISOString(),
              affectedNotifications: successful.map(n => n.id || 'unknown')
            }
          })
        }
      }

    } catch (err) {
      console.error('Error retrying failed notifications:', err)
      
      // Crear notificación de error crítico del sistema
      if (user) {
        await createSystemErrorNotification(
          user.id,
          'critical_system_error',
          'Error crítico en el sistema de notificaciones'
        )
      }
    }
  }, [createNotification, createSystemErrorNotification, user, toast])

  // Refrescar notificaciones
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
    await retryFailedNotifications()
  }, [fetchNotifications, retryFailedNotifications])

  // Cargar notificaciones al montar
  useEffect(() => {
    if (user) {
      console.log('🔔 useNotifications: Fetching notifications for user:', user.id)
      fetchNotifications()
    } else {
      console.log('🔔 useNotifications: No user found, clearing notifications')
      setNotifications([])
      setStats(null)
    }
  }, [user, fetchNotifications])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, user, fetchNotifications])

  const unreadCount = stats?.unread || 0

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getUnreadNotifications,
    getNotificationsByProject,
    getNotificationsByType,
    retryFailedNotifications,
    refreshNotifications,
    createSystemErrorNotification
  }
}