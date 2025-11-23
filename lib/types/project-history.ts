export interface ProjectHistoryEntry {
  id: string;
  projectId: string;
  userId: string;
  changeType: ChangeType;
  entityType: EntityType;
  entityId: string;
  description: string;
  details: Record<string, any>;
  timestamp: string;
  userAgent: string;
  metadata: {
    source: 'manual' | 'ai_generated' | 'system';
    version: string;
    [key: string]: any;
  };
}

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
  
  // Reuniones
  | 'meeting_created'
  | 'meeting_updated'
  | 'meeting_deleted';

export type EntityType = 
  | 'project'
  | 'userStory'
  | 'task'
  | 'sprint'
  | 'objective'
  | 'keyResult'
  | 'comment'
  | 'member'
  | 'meeting';

export interface HistoryFilters {
  projectId?: string;
  userId?: string;
  changeType?: ChangeType;
  entityType?: EntityType;
  startDate?: string;
  endDate?: string;
}

export interface HistoryContext {
  userId: string;
  projectId: string;
  userAgent?: string;
  source?: 'manual' | 'ai_generated' | 'system';
}