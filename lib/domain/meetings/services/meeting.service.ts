// Servicio de dominio para Meetings
// Las rutas pasan por el Gateway y apuntan al ScrumArtifacts-Service
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { 
  Meeting, 
  CreateMeetingCommand, 
  UpdateMeetingCommand
} from '../types/meeting.types'

export class MeetingService {
  private api = getApiClient()

  // Commands (modifican estado)
  async createMeeting(command: CreateMeetingCommand): Promise<Meeting> {
    const payload: any = {
      projectId: command.projectId,
      title: command.title,
      description: command.description,
      startDate: command.startDate,
      endDate: command.endDate,
      status: command.status || 'SCHEDULED'
    }

    console.log('[MeetingService] Creating meeting with payload:', JSON.stringify(payload, null, 2))

    // Ruta: /api/v1/meetings → Gateway → ScrumArtifacts-Service
    return this.api.post<Meeting>('/api/v1/meetings', payload)
  }

  async updateMeeting(id: string, command: UpdateMeetingCommand): Promise<Meeting> {
    const payload: any = {
      id: id
    }

    if (command.title !== undefined) payload.title = command.title
    if (command.description !== undefined) payload.description = command.description
    if (command.startDate !== undefined) payload.startDate = command.startDate
    if (command.endDate !== undefined) payload.endDate = command.endDate
    if (command.status !== undefined) payload.status = command.status

    // Ruta: /api/v1/meetings/{id} → Gateway → ScrumArtifacts-Service
    return this.api.put<Meeting>(`/api/v1/meetings/${id}`, payload)
  }

  async deleteMeeting(id: string): Promise<void> {
    // Ruta: /api/v1/meetings/{id} → Gateway → ScrumArtifacts-Service
    await this.api.delete(`/api/v1/meetings/${id}`)
  }

  // Queries (solo lectura)
  async getMeetingById(id: string): Promise<Meeting> {
    // Ruta: /api/v1/meetings/{id} → Gateway → ScrumArtifacts-Service
    return this.api.get<Meeting>(`/api/v1/meetings/${id}`)
  }

  async getMeetingsByProjectId(projectId: string): Promise<Meeting[]> {
    // Ruta: /api/v1/meetings/project/{projectId} → Gateway → ScrumArtifacts-Service
    console.log(`[MeetingService] Getting meetings for projectId: ${projectId}`)
    const result = await this.api.get<Meeting[]>(`/api/v1/meetings/project/${projectId}`)
    console.log(`[MeetingService] Received ${Array.isArray(result) ? result.length : 0} meetings`)
    return result
  }

  async getAllMeetings(): Promise<Meeting[]> {
    // Ruta: /api/v1/meetings → Gateway → ScrumArtifacts-Service
    return this.api.get<Meeting[]>('/api/v1/meetings')
  }
}

export const meetingService = new MeetingService()

