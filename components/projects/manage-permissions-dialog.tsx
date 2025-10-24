"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Settings, 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  UserCog,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  PROJECT_ROLES as LIB_PROJECT_ROLES, 
  PERMISSION_LABELS as LIB_PERMISSION_LABELS, 
  updateUserProjectRole, 
  removeUserFromProject,
  getProjectMembersWithRoles
} from "@/lib/project-permissions"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  projectRole?: string
  projectPermissions?: string[]
}

interface ProjectMember {
  userId: string
  role: string
  permissions: string[]
  addedAt: string
  addedBy: string
}

interface ProjectPermissions {
  [key: string]: ProjectMember
}

interface ManagePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentUser: User
  isAdmin: boolean
  onPermissionsUpdated: () => void
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  projectId,
  currentUser,
  isAdmin,
  onPermissionsUpdated,
}: ManagePermissionsDialogProps) {
  const { toast } = useToast()
  const [members, setMembers] = useState<User[]>([])
  const [projectPermissions, setProjectPermissions] = useState<ProjectPermissions>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null)

  useEffect(() => {
    if (open) {
      fetchProjectMembers()
    }
  }, [open, projectId])

  const fetchProjectMembers = async () => {
    setIsLoading(true)
    try {
      const membersWithRoles = await getProjectMembersWithRoles(projectId)
      setMembers(membersWithRoles)

      // Build permissions object from the fetched data
      const permissions: ProjectPermissions = {}
      membersWithRoles.forEach((member: User) => {
        permissions[member.id] = {
          userId: member.id,
          role: member.projectRole || "contributor",
          permissions: member.projectPermissions || LIB_PROJECT_ROLES.contributor.permissions,
          addedAt: new Date().toISOString(),
          addedBy: currentUser.id
        }
      })
      
      setProjectPermissions(permissions)
    } catch (error) {
      console.error("Error cargando miembros:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para modificar roles de miembros",
        variant: "destructive",
      })
      return
    }

    // Prevenir que el usuario se quite sus propios permisos de admin
    if (memberId === currentUser.id && newRole !== "admin") {
      toast({
        title: "Acción no permitida",
        description: "No puedes reducir tus propios permisos de administrador",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const success = await updateUserProjectRole(projectId, memberId, newRole, currentUser.id)
      
      if (success) {
        const updatedPermissions = {
          ...projectPermissions,
          [memberId]: {
            ...projectPermissions[memberId],
            role: newRole,
            permissions: LIB_PROJECT_ROLES[newRole as keyof typeof LIB_PROJECT_ROLES].permissions,
          }
        }

        setProjectPermissions(updatedPermissions)

        const member = members.find(m => m.id === memberId)
        toast({
          title: "Permisos actualizados",
          description: `Los permisos de ${member?.name} han sido actualizados a ${LIB_PROJECT_ROLES[newRole as keyof typeof LIB_PROJECT_ROLES].label}`,
        })

        onPermissionsUpdated()
      } else {
        throw new Error("Failed to update permissions")
      }
    } catch (error) {
      console.error("Error actualizando permisos:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los permisos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMemberClick = (memberId: string) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para eliminar miembros",
        variant: "destructive",
      })
      return
    }

    // Prevenir que el creador se elimine a sí mismo
    if (memberId === currentUser.id) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminarte a ti mismo del proyecto",
        variant: "destructive",
      })
      return
    }

    // Encontrar el miembro y abrir diálogo de confirmación
    const member = members.find(m => m.id === memberId)
    if (member) {
      setMemberToRemove(member)
      setIsConfirmDialogOpen(true)
    }
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return

    setIsLoading(true)
    try {
      const success = await removeUserFromProject(projectId, memberToRemove.id)
      
      if (success) {
        // Actualizar estado local
        setMembers(members.filter(m => m.id !== memberToRemove.id))
        const updatedPermissions = { ...projectPermissions }
        delete updatedPermissions[memberToRemove.id]
        setProjectPermissions(updatedPermissions)

        toast({
          title: "Miembro eliminado",
          description: `${memberToRemove.name} ha sido eliminado del proyecto`,
        })

        // Cerrar diálogos y limpiar estado
        setIsConfirmDialogOpen(false)
        setMemberToRemove(null)
        onPermissionsUpdated()
      } else {
        throw new Error("Failed to remove member")
      }
    } catch (error) {
      console.error("Error eliminando miembro:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />
      case "manager": return <ShieldCheck className="h-4 w-4" />
      case "contributor": return <Edit className="h-4 w-4" />
      case "viewer": return <Eye className="h-4 w-4" />
      default: return <UserCog className="h-4 w-4" />
    }
  }

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-destructive" />
              Acceso Denegado
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para gestionar los permisos de este proyecto. 
              Solo los administradores pueden realizar esta acción.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto sm:max-w-7xl md:max-w-7xl lg:max-w-7xl xl:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestionar Permisos del Proyecto
          </DialogTitle>
          <DialogDescription>
            Asigna y modifica los roles y permisos de los miembros del proyecto
          </DialogDescription>
        </DialogHeader>

        {/* Información de roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Roles Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(LIB_PROJECT_ROLES).map(([key, role]) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${role.color} text-white`}>
                    {getRoleIcon(key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {LIB_PERMISSION_LABELS[permission as keyof typeof LIB_PERMISSION_LABELS]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Lista de miembros */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Miembros del Proyecto</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {members.map((member) => {
                const memberPermissions = projectPermissions[member.id]
                const role = memberPermissions?.role || member.projectRole || "contributor"
                const roleInfo = LIB_PROJECT_ROLES[role as keyof typeof LIB_PROJECT_ROLES]
                const isCurrentUser = member.id === currentUser.id

                return (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback className="bg-chart-1 text-white">
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">Tú</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${roleInfo.color} text-white`}>
                                {getRoleIcon(role)}
                                <span className="ml-1">{roleInfo.label}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={role}
                            onValueChange={(newRole) => updateMemberRole(member.id, newRole)}
                            disabled={isLoading || isCurrentUser}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(LIB_PROJECT_ROLES).map(([key, roleOption]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    {getRoleIcon(key)}
                                    {roleOption.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {!isCurrentUser && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMemberClick(member.id)}
                              disabled={isLoading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Permisos detallados */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Permisos:</p>
                        <div className="flex flex-wrap gap-1">
                          {roleInfo.permissions.map(permission => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {LIB_PERMISSION_LABELS[permission as keyof typeof LIB_PERMISSION_LABELS]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Diálogo de confirmación para eliminar miembro */}
    <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar miembro del proyecto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente a <strong>{memberToRemove?.name}</strong> del proyecto 
            y revocará todos sus permisos de acceso. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setIsConfirmDialogOpen(false)
              setMemberToRemove(null)
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemoveMember}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            {isLoading ? "Eliminando..." : "Eliminar miembro"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}