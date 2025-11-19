"use client"

// Re-exportar el hook del dominio para mantener compatibilidad
export { useNotifications } from '@/lib/domain/notifications/hooks/use-notifications'
export type { Notification, NotificationFilters, NotificationStats } from '@/lib/domain/notifications/types/notification.types'
export type { NotificationType } from '@/lib/types/notifications'
