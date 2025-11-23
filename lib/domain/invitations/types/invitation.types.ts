// Value Objects y Tipos del dominio Invitations

export type InvitationStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'

// Entity (Invitation)
export interface Invitation {
  id: number
  projectId: number
  email: string
  role: string
  status: InvitationStatus
  invitedBy: string
  createdAt: string
  expiresAt?: string
}

// Commands
export interface CreateInvitationCommand {
  projectId: number | string  // Puede ser número o UUID (string)
  email: string
  invitedBy: string | number  // Puede ser UUID (string) o número (Long)
  message?: string  // Mensaje de invitación (opcional)
  expiresAt?: string  // Fecha de expiración en formato ISO (opcional)
}

export interface UpdateInvitationCommand {
  status: InvitationStatus
}

