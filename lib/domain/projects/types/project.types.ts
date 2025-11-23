// Value Objects y Tipos del dominio Projects

export type ProjectStatus = 
  | 'draft' 
  | 'planning'
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'archived'

export interface ProjectTimeline {
  start: string
  end: string
  milestones?: Milestone[]
}

export interface Milestone {
  name: string
  date: string
  description: string
}

export interface StructuredPrompt {
  objective: string
  role: string
  context: string
  constraints: string
}

// Aggregate Root (Project)
export interface Project {
  projectId: string                    // UUID del proyecto (primary key)
  name: string
  description: string
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  ownerId: string                      // UUID del owner
  members: string[]                    // UUIDs de miembros
  objectives: string[]                 // Objetivos del proyecto
  structuredPrompt: string | null     // Prompt usado para crear el proyecto con IA
  aiGenerated: boolean                 // Indica si el proyecto fue generado con IA
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Entity (Permission dentro del agregado Project)
export interface ProjectPermission {
  id: string  // UUID
  projectId: string  // UUID del proyecto
  userId: string  // UUID del usuario
  role: ProjectRole
  read: boolean
  write: boolean
  manageProject: boolean
  manageMembers: boolean
  managePermissions: boolean
  addedBy: string | null
}

export type ProjectRole = 
  | 'scrum_master' 
  | 'product_owner' 
  | 'developer' 
  | 'tester' 
  | 'designer' 
  | 'stakeholder'
  | 'contributor'

// Commands
export interface CreateProjectCommand {
  name: string
  description: string
  objectives?: string[]
  timeline?: {
    start: string
    end: string
  }
  members?: string[]
  createdBy: string
  status?: ProjectStatus
  aiGenerated?: boolean
  structuredPrompt?: string
}

export interface UpdateProjectCommand {
  name?: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
  objectives?: string[]
}

// Queries
export interface GetProjectQuery {
  id?: string  // UUID (ahora es projectId)
  projectId?: string  // UUID del proyecto
  userId?: string
}

