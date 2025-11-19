// Value Objects y Tipos del dominio OKRs

export type OkrStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type OkrType = 
  | 'COMPANY'
  | 'TEAM'
  | 'INDIVIDUAL'

// Aggregate Root (OKR)
export interface Okr {
  id: number
  projectId: number
  title: string
  description: string | null
  type: OkrType
  ownerId: string
  quarter: string
  status: OkrStatus
  progress: number
  startDate: string | null
  endDate: string | null
  keyResults: KeyResult[]
  createdAt: string
  updatedAt: string
}

// Entity (KeyResult dentro del agregado OKR)
export interface KeyResult {
  id: number
  okrId: number
  title: string
  description: string | null
  targetValue: number
  currentValue: number
  unit: string
  status: string
  createdAt: string
  updatedAt: string
}

// Commands
export interface CreateOkrCommand {
  projectId: number | string  // Acepta number o string, el servicio lo convierte a string
  title: string
  description?: string
  type: OkrType
  ownerId: string
  quarter: string
  status?: OkrStatus
  startDate?: string
  endDate?: string
}

export interface UpdateOkrCommand {
  title?: string
  description?: string
  status?: OkrStatus
  progress?: number
  startDate?: string
  endDate?: string
}

export interface CreateKeyResultCommand {
  okrId: number | string  // Acepta number o string, el servicio lo convierte a string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  unit: string
  status: string
}

export interface UpdateKeyResultCommand {
  title?: string
  description?: string
  targetValue?: number
  currentValue?: number
  unit?: string
  status?: string
}

