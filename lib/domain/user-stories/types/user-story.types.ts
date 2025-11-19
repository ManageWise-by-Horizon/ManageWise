// Tipos para User Stories
export interface UserStory {
  id: string
  projectId: string
  createdBy: string
  title: string
  description: string
  storyPoints: number
  priority: string
  status: string
  acceptanceCriteria: string[]
  aiGenerated: boolean
  qualityMetrics?: {
    bleu: number
    rouge: number
  }
}

export interface CreateUserStoryCommand {
  projectId: string
  createdBy: string
  title: string
  description: string
  storyPoints: number
  priority?: string
  status?: string
  acceptanceCriteria: string[]
  aiGenerated?: boolean
}

export interface UpdateUserStoryCommand {
  id: string
  projectId?: string
  title?: string
  description?: string
  storyPoints?: number
  priority?: string
  status?: string
  acceptanceCriteria?: string[]
}

