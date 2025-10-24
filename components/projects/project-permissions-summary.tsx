"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { Shield, ShieldCheck, Eye, Edit, Loader2, ShieldX } from "lucide-react"

interface ProjectPermissionsSummaryProps {
  projectId: string
  userId: string
  className?: string
}

const PERMISSION_ICONS = {
  read: Eye,
  write: Edit,
  delete: ShieldX,
  manage_members: ShieldCheck,
  manage_permissions: Shield,
  manage_project: Shield
}

const PERMISSION_LABELS = {
  read: "Ver proyecto",
  write: "Crear/Editar",
  delete: "Eliminar",
  manage_members: "Gestionar miembros",
  manage_permissions: "Gestionar permisos",
  manage_project: "Configurar proyecto"
}

export function ProjectPermissionsSummary({ 
  projectId, 
  userId, 
  className 
}: ProjectPermissionsSummaryProps) {
  const { userRole, userPermissions, hasPermission, loading, error } = useProjectPermissions(projectId, userId)

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error || !userRole) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || "No tienes acceso a este proyecto"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500"
      case "manager": return "bg-blue-500"
      case "contributor": return "bg-green-500"
      case "viewer": return "bg-gray-500"
      default: return "bg-muted"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador"
      case "manager": return "Gestor"
      case "contributor": return "Colaborador"
      case "viewer": return "Observador"
      default: return role
    }
  }

  const activePermissions = Object.entries(userPermissions)
    .filter(([_, hasPermission]) => hasPermission)
    .map(([permission]) => permission)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Tu Rol en el Proyecto</CardTitle>
        <CardDescription>Permisos y accesos asignados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rol Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${getRoleColor(userRole)} text-white`}>
            <Shield className="mr-1 h-3 w-3" />
            {getRoleLabel(userRole)}
          </Badge>
        </div>

        {/* Permisos */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Permisos activos:</p>
          <div className="grid grid-cols-1 gap-2">
            {activePermissions.map((permission) => {
              const Icon = PERMISSION_ICONS[permission as keyof typeof PERMISSION_ICONS]
              const label = PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS]
              
              return (
                <div key={permission} className="flex items-center gap-2 text-sm">
                  <Icon className="h-3 w-3 text-green-600" />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Restricciones */}
        {userRole !== "admin" && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {userRole === "viewer" && "Solo tienes acceso de lectura"}
              {userRole === "contributor" && "No puedes gestionar miembros ni configuración"}
              {userRole === "manager" && "No puedes modificar la configuración del proyecto"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}