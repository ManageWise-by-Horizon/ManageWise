// Servicio de dominio para Invitations
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { Invitation, CreateInvitationCommand, UpdateInvitationCommand } from '../types/invitation.types'

export class InvitationService {
  private api = getApiClient()

  async createInvitation(command: CreateInvitationCommand): Promise<Invitation> {
    // El backend espera CreateInvitationResource con: projectId, email, invitedBy (String UUID), message, status, expiresAt
    const payload = {
      projectId: String(command.projectId), // El backend espera String (UUID)
      email: command.email,
      invitedBy: String(command.invitedBy), // El backend espera String (UUID)
      message: command.message || '', // Mensaje de invitación
      status: 'PENDING', // Estado inicial
      expiresAt: command.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 días por defecto
    }
    
    console.log('[InvitationService] Creating invitation with payload:', JSON.stringify(payload, null, 2))
    
    try {
      const result = await this.api.post<Invitation>('/api/v1/invitations', payload)
      console.log('[InvitationService] Invitation created successfully:', result)
      return result
    } catch (error) {
      console.error('[InvitationService] Error creating invitation:', error)
      console.error('[InvitationService] Payload that failed:', JSON.stringify(payload, null, 2))
      throw error
    }
  }

  async updateInvitation(id: string, command: UpdateInvitationCommand): Promise<Invitation> {
    return this.api.put<Invitation>(`/api/v1/invitations/${id}`, command)
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.api.delete(`/api/v1/invitations/${id}`)
  }

  async getInvitationById(id: string): Promise<Invitation> {
    return this.api.get<Invitation>(`/api/v1/invitations/${id}`)
  }

  async getInvitationsByProjectId(projectId: string): Promise<Invitation[]> {
    return this.api.get<Invitation[]>(`/api/v1/invitations/projects/${projectId}`)
  }
}

export const invitationService = new InvitationService()

