// Value Objects y Tipos del dominio History

export type ChangeType = 
  // Proyectos
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  
  // Historias de usuario
  | 'user_story_created'
  | 'user_story_updated'
  | 'user_story_deleted'
  | 'user_story_status_changed'
  | 'user_story_priority_changed'
  
  // Tareas
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_status_changed'
  | 'task_assigned'
  | 'task_unassigned'
  
  // Sprints
  | 'sprint_created'
  | 'sprint_updated'
  | 'sprint_deleted'
  | 'sprint_started'
  | 'sprint_completed'
  
  // OKRs
  | 'objective_created'
  | 'objective_updated'
  | 'objective_deleted'
  | 'key_result_created'
  | 'key_result_updated'
  | 'key_result_deleted'
  | 'key_result_progress_updated'
  
  // Comentarios
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  
  // Miembros del proyecto
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'

export type EntityType = 
  | 'project'
  | 'user_story'
  | 'task'
  | 'sprint'
  | 'okr'
  | 'key_result'
  | 'invitation'
  | 'permission'
  | 'userStory'
  | 'objective'
  | 'keyResult'
  | 'comment'
  | 'member'

export interface MetadataResource {
  source: string
  version: string
}

export interface HistoryContext {
  projectId: string
  projectName?: string
  userId: string
  userName?: string
  userAgent?: string
  source?: 'manual' | 'ai_generated' | 'system'
}

export interface HistoryFilters {
  projectId?: string
  entityType?: EntityType
  changeType?: ChangeType
  dateFrom?: string
  dateTo?: string
  userId?: string
}

// Aggregate Root (History) - Alineado con el backend
export interface History {
  id: string
  projectId: string
  userId: string  // UUID del usuario
  changeType: string
  entityType: string
  entityId: string
  description: string
  details: Record<string, any>  // Objeto JSON
  timestamp: string | Date
  userAgent?: string
  metadata: MetadataResource  // Objeto con source y version
}

export interface CreateHistoryCommand {
  userId: string  // UUID del usuario
  changeType: string
  entityType: string
  entityId: string
  description: string
  details: Record<string, any>  // Objeto JSON
  timestamp: string  // ISO string
  userAgent?: string
  metadata: MetadataResource  // Objeto con source y version
}

// Alias para compatibilidad con código existente
export type ProjectHistoryEntry = History

