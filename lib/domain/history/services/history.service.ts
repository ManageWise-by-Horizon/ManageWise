// Servicio de dominio para History
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { History, CreateHistoryCommand, HistoryFilters } from '../types/history.types'

export class HistoryService {
  private api = getApiClient()

  /**
   * Crea una nueva entrada de historial
   * @param projectId UUID del proyecto
   * @param command Comando para crear el historial
   * @returns La entrada de historial creada
   */
  async createHistory(projectId: string, command: CreateHistoryCommand): Promise<History> {
    console.log(`[HistoryService] Creating history for project ${projectId}:`, JSON.stringify(command, null, 2))
    
    try {
      const result = await this.api.post<History>(`/api/v1/projects/${projectId}/history`, command)
      console.log('[HistoryService] History created successfully:', result)
      return result
    } catch (error) {
      console.error('[HistoryService] Error creating history:', error)
      throw error
    }
  }

  /**
   * Obtiene el historial de un proyecto
   * @param projectId UUID del proyecto
   * @param filters Filtros opcionales para el historial
   * @returns Lista de entradas de historial
   */
  /**
   * Normaliza el entityType del backend al formato del frontend
   * Convierte valores como "User Story" -> "userStory", "Key Result" -> "keyResult"
   */
  private normalizeEntityType(backendEntityType: string): string {
    const entityTypeMap: Record<string, string> = {
      'Project': 'project',
      'User Story': 'userStory',
      'Task': 'task',
      'Okr': 'okr',
      'Key Result': 'keyResult',
      'Sprint': 'sprint',
      'Comment': 'comment',
      'Member': 'member',
      'Meeting': 'meeting',
      // También manejar valores ya normalizados
      'user_story': 'userStory',
      'key_result': 'keyResult',
      'meeting': 'meeting',
      'sprint': 'sprint'
    }
    
    // Si ya está en el mapa, retornarlo
    if (entityTypeMap[backendEntityType]) {
      return entityTypeMap[backendEntityType]
    }
    
    // Si ya está en formato camelCase o snake_case, normalizarlo
    const lower = backendEntityType.toLowerCase().replace(/\s+/g, '_')
    if (lower === 'user_story') return 'userStory'
    if (lower === 'key_result') return 'keyResult'
    if (lower === 'sprint') return 'sprint'
    if (lower === 'meeting') return 'meeting'
    
    // Por defecto, convertir a camelCase
    return backendEntityType.toLowerCase().replace(/\s+/g, '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  /**
   * Normaliza el changeType del backend al formato del frontend
   * Convierte valores como "CREATE" -> "userStory_created", "UPDATE" -> "userStory_updated", etc.
   */
  private normalizeChangeType(backendChangeType: string, entityType: string): string {
    // Primero normalizar el entityType (usar el valor original del backend)
    const normalizedEntity = this.normalizeEntityType(entityType)
    
    // Mapeo de valores del backend (CREATE, UPDATE, DELETE) a valores del frontend
    const changeTypeUpper = backendChangeType.toUpperCase()
    
    if (changeTypeUpper === 'CREATE') {
      return `${normalizedEntity}_created`
    }
    if (changeTypeUpper === 'UPDATE') {
      return `${normalizedEntity}_updated`
    }
    if (changeTypeUpper === 'DELETE') {
      return `${normalizedEntity}_deleted`
    }
    
    // Si ya está en el formato correcto (contiene "_created", "_updated", "_deleted"), retornarlo tal cual
    const lowerChangeType = backendChangeType.toLowerCase()
    if (lowerChangeType.includes('_created') || lowerChangeType.includes('_updated') || lowerChangeType.includes('_deleted')) {
      return backendChangeType.toLowerCase()
    }
    
    // Si contiene "created", "updated", "deleted", etc., construir el formato correcto
    if (lowerChangeType.includes('create')) {
      return `${normalizedEntity}_created`
    }
    if (lowerChangeType.includes('update')) {
      return `${normalizedEntity}_updated`
    }
    if (lowerChangeType.includes('delete')) {
      return `${normalizedEntity}_deleted`
    }
    
    // Por defecto, retornar el valor original en minúsculas
    return backendChangeType.toLowerCase()
  }

  async getHistoryByProjectId(projectId: string, filters?: HistoryFilters): Promise<History[]> {
    console.log(`[HistoryService] Getting history for project ${projectId} with filters:`, filters)
    
    // El backend actualmente no soporta filtros en query params, solo devuelve todo el historial del proyecto
    // Si necesitas filtros, puedes implementarlos en el frontend después de obtener los datos
    const result = await this.api.get<History[]>(`/api/v1/projects/${projectId}/history`)
    
    console.log(`[HistoryService] Received ${Array.isArray(result) ? result.length : 0} history entries`)
    
    // Normalizar los datos del backend al formato del frontend
    let normalizedResult = Array.isArray(result) ? result.map(entry => ({
      ...entry,
      entityType: this.normalizeEntityType(entry.entityType),
      changeType: this.normalizeChangeType(entry.changeType, entry.entityType)
    })) : []
    
    // Aplicar filtros en el frontend si se proporcionaron
    if (filters && normalizedResult.length > 0) {
      let filtered = normalizedResult
      
      if (filters.entityType) {
        filtered = filtered.filter(h => h.entityType === filters.entityType)
      }
      
      if (filters.changeType) {
        filtered = filtered.filter(h => h.changeType === filters.changeType)
      }
      
      if (filters.userId) {
        filtered = filtered.filter(h => h.userId === filters.userId)
      }
      
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom)
        filtered = filtered.filter(h => {
          const timestamp = typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
          return timestamp >= dateFrom
        })
      }
      
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo)
        filtered = filtered.filter(h => {
          const timestamp = typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
          return timestamp <= dateTo
        })
      }
      
      return filtered
    }
    
    return normalizedResult
  }

  /**
   * Obtiene una entrada de historial por su ID
   * @param projectId UUID del proyecto
   * @param historyId UUID de la entrada de historial
   * @returns La entrada de historial
   */
  async getHistoryById(projectId: string, historyId: string): Promise<History> {
    console.log(`[HistoryService] Getting history ${historyId} for project ${projectId}`)
    return this.api.get<History>(`/api/v1/projects/${projectId}/history/${historyId}`)
  }
}

export const historyService = new HistoryService()

