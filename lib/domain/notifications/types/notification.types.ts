// Value Objects y Tipos del dominio Notifications

export type NotificationType = 
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'member_added'
  | 'member_removed'
  | 'task_assigned'
  | 'task_completed'
  | 'sprint_started'
  | 'sprint_completed'
  | 'okr_created'
  | 'okr_updated'
  | 'okr_completed'
  | 'comment_added'
  | 'mention'
  | 'system_alert'
  | 'system_recovery'

export type DeliveryStatus = 
  | 'pending'
  | 'delivered'
  | 'failed'

export interface NotificationData {
  projectId?: string
  projectName?: string
  taskId?: string
  taskTitle?: string
  commentId?: string
  commentText?: string
  changedBy?: string
  changedByName?: string
  changeType?: string
  declinedBy?: string
  declinedByName?: string
  [key: string]: any
}

// Aggregate Root (Notification)
export interface Notification {
  id: string
  userId: string
  projectId?: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  read: boolean
  createdAt: string
  readAt?: string | null
  deliveryStatus?: DeliveryStatus
  retryCount?: number
  lastRetryAt?: string
  failureReason?: string
}

export interface NotificationFilters {
  userId?: string  // Requerido por el backend
  projectId?: string
  type?: NotificationType
  read?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byProject: Record<string, number>
}

