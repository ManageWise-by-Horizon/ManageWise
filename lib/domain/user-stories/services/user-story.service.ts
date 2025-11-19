// Servicio de dominio para User Stories
// Las rutas pasan por el Gateway y apuntan al ScrumArtifacts-Service
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { 
  UserStory, 
  CreateUserStoryCommand, 
  UpdateUserStoryCommand
} from '../types/user-story.types'

export class UserStoryService {
  private api = getApiClient()

  // Commands (modifican estado)
  async createUserStory(command: CreateUserStoryCommand): Promise<UserStory> {
    const payload: any = {
      projectId: command.projectId,
      createdBy: command.createdBy,
      title: command.title,
      description: command.description,
      storyPoints: command.storyPoints,
      acceptanceCriteria: command.acceptanceCriteria || [],
      aiGenerated: command.aiGenerated || false
    }

    // Campos opcionales
    if (command.priority) {
      payload.priority = command.priority
    }
    if (command.status) {
      payload.status = command.status
    }

    console.log('[UserStoryService] Creating user story with payload:', JSON.stringify(payload, null, 2))

    // Ruta: /api/v1/user-stories → Gateway → ScrumArtifacts-Service
    return this.api.post<UserStory>('/api/v1/user-stories', payload)
  }

  async updateUserStory(id: string, command: UpdateUserStoryCommand): Promise<UserStory> {
    const payload: any = {}

    if (command.projectId !== undefined) payload.projectId = command.projectId
    if (command.title !== undefined) payload.title = command.title
    if (command.description !== undefined) payload.description = command.description
    if (command.storyPoints !== undefined) payload.storyPoints = command.storyPoints.toString()
    if (command.priority !== undefined) payload.priority = command.priority
    if (command.status !== undefined) payload.status = command.status
    if (command.acceptanceCriteria !== undefined) payload.acceptanceCriteria = command.acceptanceCriteria

    // El backend UpdateUserStoryResource requiere id
    payload.id = id

    // Ruta: /api/v1/user-stories/{id} → Gateway → ScrumArtifacts-Service
    return this.api.put<UserStory>(`/api/v1/user-stories/${id}`, payload)
  }

  async deleteUserStory(id: string): Promise<void> {
    // Ruta: /api/v1/user-stories/{id} → Gateway → ScrumArtifacts-Service
    await this.api.delete(`/api/v1/user-stories/${id}`)
  }

  // Queries (solo lectura)
  async getUserStoryById(id: string): Promise<UserStory> {
    // Ruta: /api/v1/user-stories/{id} → Gateway → ScrumArtifacts-Service
    return this.api.get<UserStory>(`/api/v1/user-stories/${id}`)
  }

  async getUserStoriesByProjectId(projectId: string): Promise<UserStory[]> {
    // Ruta: /api/v1/user-stories/project/{projectId} → Gateway → ScrumArtifacts-Service
    // El backend espera projectId como String (UUID)
    console.log(`[UserStoryService] Getting user stories for projectId: ${projectId}`)
    const result = await this.api.get<UserStory[]>(`/api/v1/user-stories/project/${projectId}`)
    console.log(`[UserStoryService] Received ${Array.isArray(result) ? result.length : 0} user stories`)
    console.log(`[UserStoryService] Result:`, JSON.stringify(result, null, 2))
    return result
  }

  async getUserStoriesByEpicId(epicId: string): Promise<UserStory[]> {
    // Ruta: /api/v1/user-stories/epic/{epicId} → Gateway → ScrumArtifacts-Service
    // Nota: Este endpoint puede no funcionar si Epic fue eliminado
    return this.api.get<UserStory[]>(`/api/v1/user-stories/epic/${epicId}`)
  }

  async getAllUserStories(): Promise<UserStory[]> {
    // Ruta: /api/v1/user-stories → Gateway → ScrumArtifacts-Service
    return this.api.get<UserStory[]>('/api/v1/user-stories')
  }
}

export const userStoryService = new UserStoryService()

