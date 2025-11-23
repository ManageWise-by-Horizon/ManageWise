// Servicio de dominio para OKRs
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { 
  Okr, 
  KeyResult,
  CreateOkrCommand,
  UpdateOkrCommand,
  CreateKeyResultCommand,
  UpdateKeyResultCommand
} from '../types/okr.types'

export class OkrService {
  private api = getApiClient()

  // Commands - OKRs
  async createOkr(command: CreateOkrCommand): Promise<Okr> {
    // El backend espera: OBJECTIVE, KEY_RESULT, o INITIATIVE
    // Mapear el tipo del frontend al backend
    const backendType = command.type === 'COMPANY' || command.type === 'TEAM' || command.type === 'INDIVIDUAL'
      ? 'OBJECTIVE' // Por defecto, todos los OKRs son OBJECTIVE
      : command.type
    
    return this.api.post<Okr>('/api/v1/okrs', {
      projectId: String(command.projectId),
      title: command.title,
      description: command.description,
      type: backendType,
      ownerId: command.ownerId,
      quarter: command.quarter,
      status: command.status || 'NOT_STARTED',
      progress: 0, // El backend requiere progress, por defecto 0
      startDate: command.startDate,
      endDate: command.endDate
    })
  }

  async updateOkr(id: string, command: UpdateOkrCommand): Promise<Okr> {
    // El backend espera UpdateOkrResource con todos los campos
    // Primero obtener el OKR actual para tener los valores que no cambian
    const currentOkr = await this.getOkrById(id)
    
    // Mapear el tipo del frontend al backend si es necesario
    // El backend espera: OBJECTIVE, KEY_RESULT, o INITIATIVE
    // El frontend tiene: COMPANY, TEAM, INDIVIDUAL
    let backendType: string = currentOkr.type as string
    if (currentOkr.type === 'COMPANY' || currentOkr.type === 'TEAM' || currentOkr.type === 'INDIVIDUAL') {
      backendType = 'OBJECTIVE' // Mapear al tipo del backend
    }
    
    // Construir el payload con todos los campos requeridos
    // Usar los valores del comando si están presentes, sino usar los valores actuales
    // Asegurar que progress sea un número válido (BigDecimal en el backend)
    // El backend espera BigDecimal, que puede ser un número o string numérico
    let progressValue: number
    if (command.progress !== undefined) {
      progressValue = typeof command.progress === 'number' ? command.progress : Number(command.progress) || 0
    } else if (currentOkr.progress !== undefined) {
      progressValue = typeof currentOkr.progress === 'number' ? currentOkr.progress : Number(currentOkr.progress) || 0
    } else {
      progressValue = 0
    }
    // Asegurar que progress esté entre 0 y 100
    progressValue = Math.max(0, Math.min(100, progressValue))
    
    // Formatear fechas: si vienen como string, asegurar formato YYYY-MM-DD
    const formatDate = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null
      // Si ya está en formato YYYY-MM-DD, devolverlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
      // Intentar parsear y formatear
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        return date.toISOString().split('T')[0]
      } catch {
        return null
      }
    }
    
    // Validar que los campos requeridos no sean null o vacíos
    const titleValue = (command.title ?? currentOkr.title)?.trim()
    const ownerIdValue = currentOkr.ownerId?.trim()
    const quarterValue = currentOkr.quarter?.trim()
    
    if (!titleValue) {
      throw new Error('El título del OKR es requerido')
    }
    if (!ownerIdValue) {
      throw new Error('El ownerId del OKR es requerido')
    }
    if (!quarterValue) {
      throw new Error('El quarter del OKR es requerido')
    }
    
    const payload: any = {
      id: id,
      title: titleValue,
      description: command.description !== undefined ? (command.description || null) : (currentOkr.description || null),
      type: backendType,
      ownerId: ownerIdValue,
      quarter: quarterValue,
      status: command.status ?? currentOkr.status ?? 'NOT_STARTED',
      progress: progressValue,
      startDate: formatDate(command.startDate ?? currentOkr.startDate),
      endDate: formatDate(command.endDate ?? currentOkr.endDate)
    }
    
    // Remover campos undefined para evitar problemas de serialización
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key]
      }
    })
    
    console.log('[OkrService] Updating OKR with payload:', JSON.stringify(payload, null, 2))
    console.log('[OkrService] Updating OKR ID:', id)
    
    try {
      const result = await this.api.put<Okr>(`/api/v1/okrs/${id}`, payload)
      console.log('[OkrService] OKR updated successfully:', result)
      return result
    } catch (error) {
      console.error('[OkrService] Error updating OKR:', error)
      console.error('[OkrService] Payload that failed:', JSON.stringify(payload, null, 2))
      throw error
    }
  }

  async deleteOkr(id: string): Promise<void> {
    await this.api.delete(`/api/v1/okrs/${id}`)
  }

  // Commands - Key Results
  async createKeyResult(command: CreateKeyResultCommand): Promise<KeyResult> {
    // El backend espera projectId, pero el comando solo tiene okrId
    // Necesitamos obtener el OKR para obtener el projectId
    const okr = await this.getOkrById(String(command.okrId))
    
    return this.api.post<KeyResult>('/api/v1/key-results', {
      projectId: okr.projectId,
      okrId: String(command.okrId),
      title: command.title,
      description: command.description,
      targetValue: command.targetValue,
      currentValue: command.currentValue,
      unit: command.unit,
      status: command.status
    })
  }

  async updateKeyResult(id: string, command: UpdateKeyResultCommand): Promise<KeyResult> {
    return this.api.put<KeyResult>(`/api/v1/key-results/${id}`, command)
  }

  async deleteKeyResult(id: string): Promise<void> {
    await this.api.delete(`/api/v1/key-results/${id}`)
  }

  // Queries - OKRs
  async getOkrById(id: string): Promise<Okr> {
    return this.api.get<Okr>(`/api/v1/okrs/${id}`)
  }

  async getOkrsByProjectId(projectId: string): Promise<Okr[]> {
    return this.api.get<Okr[]>(`/api/v1/okrs/projects/${projectId}`)
  }

  // Queries - Key Results
  async getKeyResultById(id: string): Promise<KeyResult> {
    return this.api.get<KeyResult>(`/api/v1/key-results/${id}`)
  }

  async getKeyResultsByOkrId(okrId: string): Promise<KeyResult[]> {
    return this.api.get<KeyResult[]>(`/api/v1/key-results/okrs/${okrId}`)
  }
}

export const okrService = new OkrService()

