import { useState, useEffect } from "react"
import { createApiUrl, apiRequest } from "@/lib/api-config"

export type ProjectPermission = "read" | "write" | "manage_project" | "manage_members" | "manage_permissions"

export interface ProjectPermissions {
  read: boolean
  write: boolean
  manage_project: boolean
  manage_members: boolean
  manage_permissions: boolean
}

export function useProjectPermissions(projectId: string, userId: string) {
  const [permissions, setPermissions] = useState<ProjectPermissions>({
    read: false,
    write: false,
    manage_project: false,
    manage_members: false,
    manage_permissions: false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true)
        
        // Obtener permisos reales desde la API
        const url = createApiUrl(`/projectPermissions?projectId=${projectId}&userId=${userId}`)
        const response = await apiRequest(url)
        
        if (!response.ok) {
          throw new Error('Error al cargar los permisos')
        }
        
        const permissionsData = await response.json()
        
        // Si el usuario tiene permisos específicos, usarlos. Si no, usar permisos por defecto (solo lectura)
        const userPermissions = permissionsData.length > 0 ? permissionsData[0] : {
          read: true,
          write: false,
          manage_project: false,
          manage_members: false,
          manage_permissions: false
        }
        
        setPermissions(userPermissions)
      } catch (error) {
        console.error("Error fetching permissions:", error)
        // En caso de error, denegar todos los permisos
        setPermissions({
          read: false,
          write: false,
          manage_project: false,
          manage_members: false,
          manage_permissions: false
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId && projectId) {
      fetchPermissions()
    }
  }, [projectId, userId])

  const hasPermission = (permission: ProjectPermission): boolean => {
    return permissions[permission] || false
  }

  const hasAnyPermission = (requiredPermissions: ProjectPermission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (requiredPermissions: ProjectPermission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission))
  }

  const getUserRole = (): string => {
    if (permissions.manage_permissions || permissions.manage_project) {
      return "Admin"
    }
    if (permissions.manage_members) {
      return "Manager"
    }
    if (permissions.write) {
      return "Miembro"
    }
    if (permissions.read) {
      return "Visualizador"
    }
    return "Sin acceso"
  }

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: getUserRole()
  }
}
