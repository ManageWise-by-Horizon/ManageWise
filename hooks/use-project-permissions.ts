import { useState, useEffect, useMemo } from "react"
import { permissionService } from "@/lib/domain/projects/services/permission.service"
import type { ProjectPermission as DDDProjectPermission } from "@/lib/domain/projects/types/project.types"

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
      if (!projectId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Obtener todos los permisos del proyecto desde la API DDD
        const allPermissions = await permissionService.getPermissionsByProjectId(projectId)
        
        // Buscar el permiso del usuario actual comparando UUIDs como strings
        const userPermission = allPermissions.find(p => p.userId === userId)
        
        // Si el usuario tiene permisos específicos, usarlos. Si no, usar permisos por defecto
        if (userPermission) {
          setPermissions({
            read: userPermission.read || false,
            write: userPermission.write || false,
            manage_project: userPermission.manageProject || false,
            manage_members: userPermission.manageMembers || false,
            manage_permissions: userPermission.managePermissions || false
          })
        } else {
          // Si no hay permisos específicos, el usuario no tiene acceso
          setPermissions({
            read: false,
            write: false,
            manage_project: false,
            manage_members: false,
            manage_permissions: false
          })
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
        // En caso de error, no asumir permisos (mostrar sin acceso)
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

    fetchPermissions()
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
