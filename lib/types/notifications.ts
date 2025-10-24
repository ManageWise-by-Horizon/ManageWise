export type NotificationType = 
  | 'task_updated'
  | 'task_assigned'
  | 'task_completed'
  | 'task_created'
  | 'okr_updated'
  | 'okr_created'
  | 'okr_completed'
  | 'project_updated'
  | 'project_status_changed'
  | 'sprint_created'
  | 'sprint_completed'
  | 'member_added'
  | 'member_removed'
  | 'system_error'
  | 'system_recovery'

export type ChangeType = 
  | 'status_changed'
  | 'assigned'
  | 'progress_updated'
  | 'description_changed'
  | 'priority_changed'
  | 'due_date_changed'
  | 'created'
  | 'deleted'

export interface NotificationData {
  // Para tareas
  taskId?: string
  taskTitle?: string
  assignedBy?: string
  assignedByName?: string
  
  // Para OKRs
  okrId?: string
  okrTitle?: string
  oldProgress?: number
  newProgress?: number
  
  // Para proyectos
  projectId?: string
  projectName?: string
  
  // Para cambios generales
  changeType?: ChangeType
  oldValue?: string | number
  newValue?: string | number
  changedBy?: string
  changedByName?: string
  
  // Para errores del sistema
  errorType?: string
  errorMessage?: string
  recoveredAt?: string
  affectedNotifications?: string[]
  
  // Datos adicionales
  sprintId?: string
  sprintName?: string
  memberId?: string
  memberName?: string
}

export interface Notification {
  id: string
  userId: string
  projectId?: string
  type: NotificationType
  title: string
  message: string
  data: NotificationData
  read: boolean
  createdAt: string
  readAt?: string | null
  // Campos para manejo de errores y reintentos
  deliveryStatus?: 'pending' | 'delivered' | 'failed' | 'retrying'
  retryCount?: number
  lastRetryAt?: string
  failureReason?: string
}

export interface NotificationFilters {
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

// Para crear nuevas notificaciones
export interface CreateNotificationRequest {
  userId: string
  projectId?: string
  type: NotificationType
  title: string
  message: string
  data: NotificationData
}

// Para eventos de notificaciones
export interface NotificationEvent {
  type: 'notification_created' | 'notification_read' | 'notification_deleted'
  notification: Notification
  timestamp: string
}