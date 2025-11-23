// Servicio de dominio para Permissions
import { getApiClient } from '@/lib/infrastructure/api/api-client'
import type { ProjectPermission } from '../types/project.types'

export interface CreatePermissionCommand {
  projectId: string
  userId: string  // UUID del usuario
  role: string
  read: boolean
  write: boolean
  manageProject: boolean
  manageMembers: boolean
  managePermissions: boolean
  addedBy?: string
}

export interface UpdatePermissionCommand {
  role?: string
  read?: boolean
  write?: boolean
  manageProject?: boolean
  manageMembers?: boolean
  managePermissions?: boolean
}

export class PermissionService {
  private api = getApiClient()

  async createPermission(command: CreatePermissionCommand): Promise<ProjectPermission> {
    return this.api.post<ProjectPermission>('/api/v1/permissions', {
      projectId: command.projectId,
      userId: command.userId,
      role: command.role,
      read: command.read,
      write: command.write,
      manageProject: command.manageProject,
      manageMembers: command.manageMembers,
      managePermissions: command.managePermissions,
      addedBy: command.addedBy
    })
  }

  async updatePermission(id: string, command: UpdatePermissionCommand): Promise<ProjectPermission> {
    return this.api.put<ProjectPermission>(`/api/v1/permissions/${id}`, command)
  }

  async deletePermission(id: string): Promise<void> {
    await this.api.delete(`/api/v1/permissions/${id}`)
  }

  async getPermissionsByProjectId(projectId: string): Promise<ProjectPermission[]> {
    try {
      const data = await this.api.get<ProjectPermission[]>(`/api/v1/permissions/projects/${projectId}`)
      return Array.isArray(data) ? data : []
    } catch (error: any) {
      // Si el error es 404, puede ser que el proyecto no tenga permisos aún (normal en proyectos nuevos)
      // O que el proyecto no exista. En cualquier caso, devolvemos una lista vacía
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        console.warn(`No se encontraron permisos para el proyecto ${projectId}. Esto es normal para proyectos nuevos.`)
        return []
      }
      
      // Si es un error de conexión (Failed to fetch), también devolvemos lista vacía
      // para no romper la UI, pero logueamos el error
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('conectar con el servidor')) {
        console.warn(`Error de conexión al obtener permisos para el proyecto ${projectId}:`, error.message)
        return []
      }
      
      // Para otros errores, los propagamos
      throw error
    }
  }

  async getPermissionById(id: string): Promise<ProjectPermission> {
    return this.api.get<ProjectPermission>(`/api/v1/permissions/${id}`)
  }
}

export const permissionService = new PermissionService()

