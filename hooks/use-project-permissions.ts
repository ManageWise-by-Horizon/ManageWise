import { useState, useEffect } from "react"

export type ProjectPermission = "read" | "write" | "manage_project" | "manage_members" | "manage_permissions"

export interface ProjectPermissions {
  read: boolean
  write: boolean
  manage_project: boolean
  manage_members: boolean
  manage_permissions: boolean
}

// Mock data - en un sistema real esto vendría de una API
const mockPermissions: Record<string, ProjectPermissions> = {
  // Usuario admin/owner tiene todos los permisos
  "1": {
    read: true,
    write: true,
    manage_project: true,
    manage_members: true,
    manage_permissions: true
  },
  // Usuario regular tiene permisos básicos
  "2": {
    read: true,
    write: true,
    manage_project: false,
    manage_members: false,
    manage_permissions: false
  },
  // Usuario con permisos limitados
  "3": {
    read: true,
    write: false,
    manage_project: false,
    manage_members: false,
    manage_permissions: false
  }
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
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // En un sistema real, aquí harías una llamada a la API:
        // const response = await fetch(`/api/projects/${projectId}/permissions/${userId}`)
        // const userPermissions = await response.json()
        
        // Por ahora, usar datos mock
        const userPermissions = mockPermissions[userId] || {
          read: false,
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
