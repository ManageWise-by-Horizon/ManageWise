"use client"

import { ReactNode } from "react"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX, Loader2 } from "lucide-react"

interface PermissionGuardProps {
  projectId: string
  userId: string
  requiredPermission: "read" | "write" | "delete" | "manage_members" | "manage_permissions" | "manage_project"
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}

export function PermissionGuard({
  projectId,
  userId,
  requiredPermission,
  children,
  fallback,
  showError = false
}: PermissionGuardProps) {
  const { hasPermission, loading, error } = useProjectPermissions(projectId, userId)

  if (loading) {
    return fallback || (showError ? <Loader2 className="h-4 w-4 animate-spin" /> : null)
  }

  if (error || !hasPermission(requiredPermission)) {
    if (showError) {
      return (
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para realizar esta acción.
          </AlertDescription>
        </Alert>
      )
    }
    return fallback || null
  }

  return <>{children}</>
}

interface PermissionWrapperProps {
  projectId: string
  userId: string
  requiredPermission: "read" | "write" | "delete" | "manage_members" | "manage_permissions" | "manage_project"
  children: (hasPermission: boolean) => ReactNode
}

export function PermissionWrapper({
  projectId,
  userId,
  requiredPermission,
  children
}: PermissionWrapperProps) {
  const { hasPermission, loading } = useProjectPermissions(projectId, userId)

  if (loading) {
    return children(false)
  }

  return <>{children(hasPermission(requiredPermission))}</>
}