import { useState, useEffect, useCallback } from "react"
import { getUserProjectRole, hasProjectPermission } from "@/lib/project-permissions"

interface Permission {
  read: boolean
  write: boolean
  delete: boolean
  manage_members: boolean
  manage_permissions: boolean
  manage_project: boolean
}

interface UseProjectPermissionsReturn {
  userRole: string | null
  userPermissions: Permission
  hasPermission: (permission: keyof Permission) => boolean
  isAdmin: boolean
  isManager: boolean
  isContributor: boolean
  isViewer: boolean
  loading: boolean
  error: string | null
  refetch: () => void
}

const ROLE_PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_members", "manage_permissions", "manage_project"],
  manager: ["read", "write", "delete", "manage_members"],
  contributor: ["read", "write"],
  viewer: ["read"]
}

export function useProjectPermissions(
  projectId: string,
  userId: string
): UseProjectPermissionsReturn {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserRole = useCallback(async () => {
    if (!projectId || !userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const role = await getUserProjectRole(projectId, userId)
      setUserRole(role)
    } catch (err) {
      console.error("Error fetching user role:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, userId])

  useEffect(() => {
    fetchUserRole()
  }, [fetchUserRole])

  // Calcular permisos basados en el rol
  const userPermissions: Permission = {
    read: false,
    write: false,
    delete: false,
    manage_members: false,
    manage_permissions: false,
    manage_project: false
  }

  if (userRole && ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]) {
    const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
    rolePermissions.forEach(permission => {
      if (permission in userPermissions) {
        userPermissions[permission as keyof Permission] = true
      }
    })
  }

  const hasPermissionCheck = (permission: keyof Permission): boolean => {
    return userPermissions[permission]
  }

  return {
    userRole,
    userPermissions,
    hasPermission: hasPermissionCheck,
    isAdmin: userRole === "admin",
    isManager: userRole === "manager",
    isContributor: userRole === "contributor",
    isViewer: userRole === "viewer",
    loading,
    error,
    refetch: fetchUserRole
  }
}

export { ROLE_PERMISSIONS }