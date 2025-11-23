"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { Shield, Lock, Users, Settings } from "lucide-react"

interface ProjectPermissionsSummaryProps {
  projectId: string
  userId: string
}

export function ProjectPermissionsSummary({ projectId, userId }: ProjectPermissionsSummaryProps) {
  const { permissions, isLoading } = useProjectPermissions(projectId, userId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Permisos</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Cargando...</div>
          <p className="text-xs text-muted-foreground">verificando acceso</p>
        </CardContent>
      </Card>
    )
  }

  // Contar los permisos reales del usuario
  const countActivePermissions = () => {
    let count = 0
    if (permissions.read) count++
    if (permissions.write) count++
    if (permissions.manage_project) count++
    if (permissions.manage_members) count++
    if (permissions.manage_permissions) count++
    return count
  }

  const activePermissionsCount = countActivePermissions()
  const totalPermissions = 5 // read, write, manage_project, manage_members, manage_permissions

  const getPermissionLevel = () => {
    if (permissions.manage_permissions || permissions.manage_project) {
      return { level: "Admin", color: "bg-green-100 text-green-800", icon: Settings }
    }
    if (permissions.manage_members) {
      return { level: "Manager", color: "bg-blue-100 text-blue-800", icon: Users }
    }
    if (permissions.write) {
      return { level: "Editor", color: "bg-yellow-100 text-yellow-800", icon: Shield }
    }
    if (permissions.read) {
      return { level: "Lector", color: "bg-gray-100 text-gray-800", icon: Lock }
    }
    return { level: "Sin acceso", color: "bg-red-100 text-red-800", icon: Lock }
  }

  const permissionInfo = getPermissionLevel()
  const PermissionIcon = permissionInfo.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tus Permisos</CardTitle>
        <PermissionIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{permissionInfo.level}</div>
            <p className="text-xs text-muted-foreground">
              {activePermissionsCount}/{totalPermissions} permisos
            </p>
          </div>
          <Badge className={permissionInfo.color}>
            {permissionInfo.level}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
