"use client"

import { ReactNode } from "react"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from "lucide-react"

interface PermissionGuardProps {
  children: ReactNode
  projectId: string
  userId: string
  requiredPermission: "read" | "write" | "manage_project" | "manage_members" | "manage_permissions"
  showError?: boolean
}

interface PermissionWrapperProps {
  children: (hasPermission: boolean) => ReactNode
  projectId: string
  userId: string
  requiredPermission: "read" | "write" | "manage_project" | "manage_members" | "manage_permissions"
}

export function PermissionGuard({ 
  children, 
  projectId, 
  userId, 
  requiredPermission, 
  showError = false 
}: PermissionGuardProps) {
  const { hasPermission } = useProjectPermissions(projectId, userId)
  
  const canAccess = hasPermission(requiredPermission)
  
  if (!canAccess) {
    if (showError) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Lock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No tienes permisos para acceder a esta sección del proyecto.
          </AlertDescription>
        </Alert>
      )
    }
    return null
  }
  
  return <>{children}</>
}

export function PermissionWrapper({ 
  children, 
  projectId, 
  userId, 
  requiredPermission 
}: PermissionWrapperProps) {
  const { hasPermission } = useProjectPermissions(projectId, userId)
  
  const canAccess = hasPermission(requiredPermission)
  
  return <>{children(canAccess)}</>
}
