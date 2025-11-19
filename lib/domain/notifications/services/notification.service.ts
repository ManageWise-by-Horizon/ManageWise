// Servicio de dominio para Notifications
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { Notification, NotificationFilters } from '../types/notification.types'

export interface CreateNotificationCommand {
  userId: string
  projectId?: string
  type: string
  title: string
  message: string
  data?: any
}

export class NotificationService {
  private api = getApiClient()

  // Commands
  async createNotification(command: CreateNotificationCommand): Promise<Notification> {
    try {
      const data = await this.api.post<any>('/api/v1/notifications', {
        userId: command.userId,
        projectId: command.projectId,
        type: command.type,
        title: command.title,
        message: command.message,
        data: command.data ? JSON.stringify(command.data) : null
      })
      
      // Mapear el id de Long a string
      return {
        ...data,
        id: data.id?.toString() || String(data.id),
        createdAt: data.createdAt || new Date().toISOString(),
        readAt: data.readAt || null,
        data: typeof data.data === 'string' ? JSON.parse(data.data || '{}') : (data.data || {})
      }
    } catch (error: any) {
      throw error
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const data = await this.api.put<any>(`/api/v1/notifications/${id}/read`)
      // Mapear el id de Long a string
      return {
        ...data,
        id: data.id?.toString() || String(data.id),
        createdAt: data.createdAt || new Date().toISOString(),
        readAt: data.readAt || new Date().toISOString(),
        data: typeof data.data === 'string' ? JSON.parse(data.data || '{}') : (data.data || {})
      }
    } catch (error: any) {
      // Si el error es 404, puede ser que la notificación no exista
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        console.warn(`Notificación ${id} no encontrada`)
        throw error
      }
      throw error
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.api.put(`/api/v1/notifications/mark-all-read?userId=${userId}`)
    } catch (error: any) {
      // Si el error es 404 o de conexión, no hacer nada (puede ser que no haya notificaciones)
      if (error?.message?.includes('404') || 
          error?.message?.includes('Not Found') ||
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('conectar con el servidor')) {
        console.warn('Error al marcar todas las notificaciones como leídas:', error.message)
        return
      }
      throw error
    }
  }

  async deleteNotification(id: string): Promise<void> {
    await this.api.delete(`/api/v1/notifications/${id}`)
  }

  // Queries
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const params = new URLSearchParams()
    
    // userId es requerido por el backend
    if (filters?.userId) {
      params.append('userId', filters.userId)
    }
    
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.read !== undefined) params.append('read', filters.read.toString())
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)

    const queryString = params.toString()
    const url = `/api/v1/notifications${queryString ? `?${queryString}` : ''}`
    
    try {
      const data = await this.api.get<any[]>(url)
      
      // Mapear los datos del backend al formato del frontend
      // El backend retorna id como Long, pero el frontend espera string
      return (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        id: item.id?.toString() || String(item.id),
        createdAt: item.createdAt || new Date().toISOString(),
        readAt: item.readAt || null,
        data: typeof item.data === 'string' ? JSON.parse(item.data || '{}') : (item.data || {})
      }))
    } catch (error: any) {
      // Si el error es 404 o de conexión, devolver lista vacía
      if (error?.message?.includes('404') || 
          error?.message?.includes('Not Found') ||
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('conectar con el servidor')) {
        console.warn('Error al cargar notificaciones:', error.message)
        return []
      }
      throw error
    }
  }

  async getNotificationById(id: string): Promise<Notification> {
    return this.api.get<Notification>(`/api/v1/notifications/${id}`)
  }
}

export const notificationService = new NotificationService()

