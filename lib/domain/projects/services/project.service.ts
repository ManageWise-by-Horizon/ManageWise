// Servicio de dominio para Projects
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { 
  Project, 
  CreateProjectCommand, 
  UpdateProjectCommand,
  GetProjectQuery 
} from '../types/project.types'

export class ProjectService {
  private api = getApiClient()

  // Commands (modifican estado)
  async createProject(command: CreateProjectCommand): Promise<Project> {
    const payload: any = {
      name: command.name,
      description: command.description,
      createdBy: command.createdBy,
      objectives: command.objectives || [],
      aiGenerated: command.aiGenerated || false
    }

    // El backend espera un objeto timeline con start y end
    if (command.timeline && command.timeline.start && command.timeline.end) {
      payload.timeline = {
        start: command.timeline.start,
        end: command.timeline.end
      }
    }

    if (command.members) {
      payload.members = command.members
    }

    if (command.structuredPrompt) {
      payload.structuredPrompt = command.structuredPrompt
    }

    if (command.status) {
      payload.status = command.status
    }

    console.log('[ProjectService] Creating project with payload:', JSON.stringify(payload, null, 2))
    
    try {
      const result = await this.api.post<Project>('/api/v1/projects', payload)
      console.log('[ProjectService] Project created successfully:', {
        projectId: result.projectId,
        name: result.name
      })
      
      // Validar que el proyecto tenga un projectId válido
      if (!result.projectId || result.projectId.trim() === '') {
        console.error('[ProjectService] Created project has invalid projectId:', result)
        throw new Error('El proyecto creado no tiene un projectId válido')
      }
      
      return result
    } catch (error) {
      console.error('[ProjectService] Error creating project:', error)
      console.error('[ProjectService] Payload that failed:', JSON.stringify(payload, null, 2))
      throw error
    }
  }

  async updateProject(id: string, command: UpdateProjectCommand): Promise<Project> {
    const payload: any = {}
    
    if (command.name !== undefined) payload.name = command.name
    if (command.description !== undefined) payload.description = command.description
    if (command.status !== undefined) payload.status = command.status
    if (command.startDate !== undefined) payload.startDate = command.startDate
    if (command.endDate !== undefined) payload.endDate = command.endDate
    if (command.objectives !== undefined) payload.objectives = command.objectives

    return this.api.put<Project>(`/api/v1/projects/${id}`, payload)
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/api/v1/projects/${id}`)
  }

  async addMember(projectId: string, memberId: string): Promise<Project> {
    return this.api.post<Project>(`/api/v1/projects/${projectId}/members/${memberId}`)
  }

  async removeMember(projectId: string, memberId: string): Promise<Project> {
    return this.api.delete<Project>(`/api/v1/projects/${projectId}/members/${memberId}`)
  }

  // Queries (solo lectura)
  async getProject(query: GetProjectQuery): Promise<Project | null> {
    // Si tenemos id o projectId, usar el endpoint /{id} que funciona con ambos
    const projectId = query.id || query.projectId
    
    if (!projectId || projectId.trim() === '') {
      console.warn('[ProjectService] getProject called with empty projectId')
      return null
    }

    try {
      // El backend retorna un objeto ProjectResource
      // El endpoint /api/v1/projects/{id} funciona tanto con id como con projectId (UUID)
      const project = await this.api.get<Project>(`/api/v1/projects/${projectId}`)
      return project
    } catch (error) {
      console.error(`[ProjectService] Error getting project ${projectId}:`, error)
      // Si es un 404, retornar null en lugar de lanzar error
      if (error instanceof Error && error.message.includes('404')) {
        console.warn(`[ProjectService] Project ${projectId} not found (404)`)
        return null
      }
      throw error
    }
  }

  async getProjectById(projectId: string): Promise<Project> {
    // El backend puede usar el projectId (UUID) directamente en el path
    return this.api.get<Project>(`/api/v1/projects/${projectId}`)
  }

  async getAllProjects(): Promise<Project[]> {
    return this.api.get<Project[]>('/api/v1/projects')
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return this.api.get<Project[]>(`/api/v1/projects/user/${userId}`)
  }
}

export const projectService = new ProjectService()

