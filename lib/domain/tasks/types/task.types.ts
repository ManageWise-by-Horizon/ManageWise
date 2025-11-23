// Tipos para Tasks
export interface Task {
  id: string
  userStoryId: string
  assignedTo: string | null
  createdBy: string
  title: string
  description: string
  estimatedHours: number
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'ALTA' | 'MEDIA' | 'BAJA'
  aiGenerated: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface CreateTaskCommand {
  userStoryId: string
  assignedTo: string // Ahora es obligatorio, no puede ser null o undefined
  createdBy: string
  title: string
  description: string
  estimatedHours: number
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'ALTA' | 'MEDIA' | 'BAJA'
  aiGenerated?: boolean
}

export interface UpdateTaskCommand {
  id: string
  title?: string
  description?: string
  estimatedHours?: number
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority?: 'ALTA' | 'MEDIA' | 'BAJA'
  assignedTo?: string | null
}

