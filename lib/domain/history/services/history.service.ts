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
  async getHistoryByProjectId(projectId: string, filters?: HistoryFilters): Promise<History[]> {
    console.log(`[HistoryService] Getting history for project ${projectId} with filters:`, filters)
    
    // El backend actualmente no soporta filtros en query params, solo devuelve todo el historial del proyecto
    // Si necesitas filtros, puedes implementarlos en el frontend después de obtener los datos
    const result = await this.api.get<History[]>(`/api/v1/projects/${projectId}/history`)
    
    console.log(`[HistoryService] Received ${Array.isArray(result) ? result.length : 0} history entries`)
    
    // Aplicar filtros en el frontend si se proporcionaron
    if (filters && Array.isArray(result)) {
      let filtered = result
      
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
    
    return Array.isArray(result) ? result : []
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

